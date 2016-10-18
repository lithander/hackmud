function(context, args)
{
	var caller = context.caller;
	var l = #s.scripts.lib();
	var pass = 0;
	var id = context.this_script;
	if(args && args.reset)
		#db.r({_id:id});
	var rec = #db.f({_id:id}).first();
	if(!rec)
	{
		l.log("No records found!");
		rec = { 
			_id:id,
			pass:0,
		}
		#db.i(rec);
	}
	var pass = rec.pass;
	var batch = 0;	
	for (var batch = 0; batch < 20; batch++)
	{
		l.log(pass + " to " + (pass + 10));
		for(var i = 0; i < 10; i++, pass++)
		{
			var result = #s.turing_testing.test({ComplimentaryTuringTestPass:pass});
			if(!l.is_str(result) || result.indexOf("Please provide") == -1)
			{
				l.log(pass + " => `2PASS`");
				l.log(result);
				return l.get_log();
			}
		}
		//update progress in db
		#db.u(
			{_id:id}, 
			{
				$inc:{pass:10},
			});
	}
}
