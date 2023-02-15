exports.up = async function (knex, Promise) {
	await knex.schema.table("threads", table => {
	  table.dateTime("close_at").index().nullable().defaultTo(null).after("created_at");
	  table.string("close_id", 20).nullable().defaultTo(null).after("created_at");
	  table.string("close_name", 128).nullable().defaultTo(null).after("created_at");
	});
  };
  
  exports.down = async function(knex, Promise) {
	await knex.schema.table("threads", table => {
	  table.dateTime("close_at");
	  table.dropColumn("close_id");
	  table.dropColumn("close_name");
	});
  };
  