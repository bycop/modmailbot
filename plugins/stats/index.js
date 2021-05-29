module.exports = function ({ knex, commands }) {
	const getThreadsBeforeDate = async (interval = 0) => {
		if (!interval) {
			const totalThreads = await knex.table("threads")
				.count('id as count');

			return totalThreads[0].count;
		} else {
			const totalThreads = await knex.table("threads")
				.where("created_at", '>', new Date(Date.now() - interval).toISOString().slice(0, 19).replace('T', ' '))
				.count('id as count');

			return totalThreads[0].count;
		}
	};

	commands.addInboxServerCommand('serverStats', [], async (msg) => {
		const count = await getThreadsBeforeDate();
		msg.channel.createMessage({ content: `Total threads on this server: **${count}**` });
	});

	commands.addInboxServerCommand('serverStatsWeek', [], async (msg) => {
		const count = await getThreadsBeforeDate(86400 * 7 * 1000);
		msg.channel.createMessage({ content: `Total threads on this server this week: **${count}**` });
	});

	commands.addInboxServerCommand('serverStatsMonth', [], async (msg) => {
		const count = await getThreadsBeforeDate(86400 * 31 * 1000);
		msg.channel.createMessage({ content: `Total threads on this server this month: **${count}**` });
	});
}