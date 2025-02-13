import { log } from 'console';
import { config } from 'dotenv';
import knex from 'knex';

// config dotenv
config();

const connectionInfoSchema = knex({
	client: 'mysql2',
	connection: {
		host: process.env['PRIMARY_DB_HOST'] || '',
		user: process.env['PRIMARY_DB_USER'] || '',
		password: process.env['PRIMARY_DB_PASSWORD'] || '',
		database: 'information_schema',
	},
});

const connectionPrimary = knex({
	client: 'mysql2',
	connection: {
		host: process.env['PRIMARY_DB_HOST'] || '',
		user: process.env['PRIMARY_DB_USER'] || '',
		password: process.env['PRIMARY_DB_PASSWORD'] || '',
		database: process.env['PRIMARY_DB_SCHEMA'] || '',
	},
});

const connectionSecondary = knex({
	client: 'mysql2',
	connection: {
		host: process.env['SECONDARY_DB_HOST'] || '',
		user: process.env['SECONDARY_DB_USER'] || '',
		password: process.env['SECONDARY_DB_PASSWORD'] || '',
		database: process.env['SECONDARY_DB_SCHEMA'] || '',
	},
});

const tableExistsInSecondary = async (tableName: string): Promise<boolean> => {
	try {
		const [result] = await connectionSecondary.raw(
			'SHOW TABLES LIKE ?',
			[tableName]
		);
		return result.length > 0;
	} catch (error) {
		log(`Error checking table existence: ${error}`);
		return false;
	}
};

const main = async () => {
	try {
		const tables = await connectionInfoSchema('TABLES')
			.select('TABLE_NAME')
			.where('TABLE_SCHEMA', process.env['PRIMARY_DB_SCHEMA'])
			.andWhere('TABLE_TYPE', 'BASE TABLE');

		await connectionSecondary.raw('SET FOREIGN_KEY_CHECKS = 0');

		for (const table of tables) {
			const exists = await tableExistsInSecondary(table.TABLE_NAME);

			if (!exists) {
				log(`Table ${table.TABLE_NAME} does not exist in secondary database, skipping.`);
				continue;
			}

			try {
				// Truncate only if table exists
				await connectionSecondary(table.TABLE_NAME).truncate();
				log(`Truncated table: ${table.TABLE_NAME}`);

				// Copy data
				const data = await connectionPrimary(table.TABLE_NAME).select();

				for (let row = 0; row < data.length; row++) {
					try {
						await connectionSecondary(table.TABLE_NAME).insert(data[row]);
					} catch (err) {
						log(`Error inserting row ${err}`)
					}
				}
				log(`Copied data to table: ${table.TABLE_NAME}`);
			} catch (err) {
				log(`Error processing table ${table.TABLE_NAME}: ${err}`);
			}
		}

		await connectionSecondary.raw('SET FOREIGN_KEY_CHECKS = 1');
		log('Data migration completed successfully');
	} catch (error) {
		console.error('Error during migration:', error);
	} finally {
		await connectionInfoSchema.destroy();
		await connectionPrimary.destroy();
		await connectionSecondary.destroy();
	}
};

(async () => {
	await main();
})();
