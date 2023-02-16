const config = require('../../src/cfg');
const humanizeDuration = require("humanize-duration");

module.exports = function ({ knex, commands }) {
	const getThreadsBeforeDateCount = async (interval = 0, dateColumn = "created_at") => {
		if (!interval) {
			const totalThreads = await knex.table("threads")
				.count('id as count');

			return totalThreads[0].count;
		} else {
			const totalThreads = await knex.table("threads")
				.where(dateColumn, '>', new Date(Date.now() - interval).toISOString().slice(0, 19).replace('T', ' '))
				.count('id as count');

			return totalThreads[0].count;
		}
	};

	const getThreadsBeforeDate = async (interval = 0, user) => {
		if (!interval) {
			const totalThreads = await knex.table("threads")
				.where(user ? { close_id: user } : {})
				.select();

			return totalThreads;
		} else {
			const totalThreads = await knex.table("threads")
				.where("close_at", '>', new Date(Date.now() - interval).toISOString().slice(0, 19).replace('T', ' '))
				.where(user ? { close_id: user } : {})
				.select();

			return totalThreads;
		}
	};

	const countThreadsPerMod = (threads) => {
		const mods = {};

		for (const thread of threads) {
			if (thread.close_id || thread.scheduled_close_id) {
				if (mods[thread.close_id ?? thread.scheduled_close_id]) {
					mods[thread.close_id ?? thread.scheduled_close_id].count++;
				} else {
					mods[thread.close_id ?? thread.scheduled_close_id] = {
						id: thread.close_id ?? thread.scheduled_close_id,
						name: thread.close_name ?? thread.scheduled_close_name,
						count: 1
					}
				}
			}
		}

		return mods;
	};

	const generateResumeEmbed = (mods, interval) => {
		let embeds = [];

		if (mods.length === 0) {
			embeds.push({
				title: "Stats",
				description: `No threads on this server ${interval ? `last ${humanizeDuration(interval)}` : "since this system"}`,
				color: 0x2C70EE
			});
		}

		for (let i = 0; i < mods.length; i += 50) {
			embeds.push({
				title: "Stats",
				description: `Total threads on this server ${interval ? `last ${humanizeDuration(interval)}` : "since this system"}: **${mods.reduce((acc, mod) => acc + mod.count, 0)}**\n
				${mods.slice(i, i + 50).map((mod, idx) => `#${idx + 1 + embeds.length * 50}: <@${mod.id}> - ${mod.count} tickets`).join("\n	")}`,
				color: 0x2C70EE
			});
		}

		return embeds;
	}

	const processStats = async (msg, interval = 0, user) => {
		const threads = await getThreadsBeforeDate(interval, user);
		const mods = await countThreadsPerMod(threads);

		const sortedMods = Object.values(mods).sort((a, b) => b.count - a.count);

		const embeds = generateResumeEmbed(sortedMods, interval);

		for (const embed of embeds) {
			msg.channel.createMessage({ embeds: [embed] });
		}
	}


	// Server Stats Commands
	commands.addInboxServerCommand('serverStats', [], async (msg) => {
		const count = await getThreadsBeforeDateCount();
		msg.channel.createMessage({ content: `Total threads on this server: **${count}**` });
	});

	commands.addInboxServerCommand('serverStatsWeek', [], async (msg) => {
		const count = await getThreadsBeforeDateCount(86400 * 7 * 1000);
		msg.channel.createMessage({ content: `Total threads on this server this week: **${count}**` });
	});

	commands.addInboxServerCommand('serverStatsMonth', [], async (msg) => {
		const count = await getThreadsBeforeDateCount(86400 * 31 * 1000);
		msg.channel.createMessage({ content: `Total threads on this server this month: **${count}**` });
	});


	// Mods Stats Commands
	commands.addInboxServerCommand('stats', "<duration:delay> [userId:userId]", async (msg, args) => {
		if (!msg.member.roles.includes(config.ticketManagerRoleId))
			return msg.channel.createMessage({ content: "You don't have the permission to use this command." });

		const user = args.userId;
		const duration = args.duration;

		processStats(msg, duration, user);
	});

	
	commands.addInboxServerCommand('stats', [], async (msg, args) => {
		if (!msg.member.roles.includes(config.ticketManagerRoleId))
			return msg.channel.createMessage({ content: "You don't have the permission to use this command." });

		msg.channel.createMessage({ content: 'Usage: `!stats <duration> [userId]`\n\n`duration` is a human readable duration (e.g. `1d 2h 3m 4s`) or 0 for infinity\n`userId` is the id of the user you want to get stats for. If not provided, it will get stats for all users.' });
	});

}