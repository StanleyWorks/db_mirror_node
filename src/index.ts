import { config } from 'dotenv'
import knex from 'knex';

// Configure dotenv
config()

const connectionOne = knex({
	client: 'mysql2',
	connection: {
		host: process.env['PRIMARY_DB_HOST'] || '',
		user: process.env['PRIMARY_DB_USER'] || '',
		password: process.env['PRIMARY_DB_PASSWORD'] || '',
		database: 'information_schema'
	},
});

const main = async () => {
	try {
		const tables = await connectionOne('TABLES')
			.select('TABLE_NAME')
			.where('TABLE_SCHEMA', process.env['PRIMARY_DB_SCHEMA'])
			.andWhere('TABLE_TYPE', 'BASE TABLE');
		tables.forEach((table) => {
			console.log(table.TABLE_NAME);
		});
	} catch (error) {
		console.error('Error:', error);
	} finally {
		await connectionOne.destroy();
	}
};

(async () => {
	await main();
})();
