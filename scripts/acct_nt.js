function(context, args)
{
	let no_dot = function(n)
	{
		var r = 0;
		for(var i = 0; i < n.length; i++)
			if(n[i] != '.')
				r += n[i];
		return r;
	}
	
	let idx = function(n, p)
	{
		for(var i = 0; i < n.length; i++)
			if(p(n[i]))
				return i;
	}
	
	let t_int = function(v)
	{
		if(args.async)
			v = new Date(v.getTime() + args.async);
		var t_str = l.to_game_timestr(v);
		return parseInt(no_dot(t_str));
	}
	
	let eval_logs = function(a, b, noMemo)
	{
		var offset = args.o ? args.o : 0;
		var out = 0;
		var inc = 0;
		for(var i = a; i <= b; i++)
		{
			var lg = logs[i + offset];
			if(noMemo && lg.memo) //without memos
				continue;
			if(lg.sender == caller)
				out += lg.amount;
			else
				inc += lg.amount;
			
		}
		//TODO: memos
		return [out, inc, (inc - out), (out - inc)];
	}
	
	let add_log = function(i, res, self)
	{
		if(i >= logs.length || i < 0)
			return;
		var gc = logs[i].amount;
		if(self && logs[i].sender != caller)
			return;
		if(!res.includes(gc))
			res.push(gc);
	}	
	
	var caller = context.caller;
	var l = #s.scripts.lib();
	var logs = #s.accts.transactions({ count:50});
	var result = [];
	
	if(args.s != null)
	{
		var times = args.s.match(/\d*\.\d*/g);
		if(times.length == 2)
		{	
			//Need to know the total spent on transactions without memos between 161005.1741 and 161005.1849
			var i = 0;
			if(args.s.indexOf("total spent") > -1)//TODO: memos
				i = 3;
			if(args.s.indexOf("total earned") > -1)
				i = 2;
			if(args.s.indexOf("net GC") > -1)//What was the net GC between 161007.1859 and 161007.2134
				i = 2;
			var noMemo = args.s.indexOf("without memos") > -1;
			var min = parseInt(no_dot(times[0]));
			var max = parseInt(no_dot(times[1]));
			var a0 = Math.max(0,idx(logs, e => t_int(e.time) <= max) - 1); //first in range
			var a1 = Math.max(a0, idx(logs, e => t_int(e.time) < max)); //first after max
			var b0 = Math.max(a0, idx(logs, e => t_int(e.time) <= min) - 1); //first before min
			var b1 = Math.max(b0, idx(logs, e => t_int(e.time) < min)); //last in range
			//result.push("["+a0+","+a1+"] to ["+b0+","+b1+"]");
			for(var a = a0; a <= a1; a++)
				for(var b = Math.max(a, b0); b <= b1; b++)
				{
					//result.push("["+a+"] to ["+b+"]");
					var val = eval_logs(a, b, noMemo)[i];
					if(!result.includes(val))
						result.push(val);
				}
			return result;
		}
		else if(times.length == 1)
		{
			//Get me the amount of a large withdrawal near 161008.1004""
			var i = 0;
			var sender_self = args.s.indexOf("withdrawal") > -1;
			var time = parseInt(no_dot(times[0]));
			var center = idx(logs, e => t_int(e.time) <= time); //first in range
			var max = 0;
			for(var i = 0; i < logs.length; i++)
			{
				add_log(center + i, result, sender_self);
				add_log(center - i - 1, result, sender_self);
			}
			return result;
		}
		return [0];
	}
	return { ok:false, msg:"Usage: trx{ s:\"161002.2014 and 161002.2027\"}" };
}
