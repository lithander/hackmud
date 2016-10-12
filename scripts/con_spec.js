function(context, args)
{
	let nxt_high = function(i)
	{
		while(!mask[i])
			i++;
		return i;
	}
	let nxt_low = function(i)
	{
		while(mask[i])
			i++;
		return i;
	}
	// s:""
	var caller = context.caller;
	var l = #s.scripts.lib();
	var abc = "";
	var mask = [];
	var backwards = args.s[1] < args.s[0];
	for(var i = 65; i <= 90; i++)
	{
		var c = STRING.fromCharCode(i);
		var hl = (args.s.indexOf(c) > -1);
		if (backwards)
		{
			abc = c + abc;
			mask.unshift(hl);
		}
		else
		{
			mask.push(hl);
			abc += c;
		}
	}
	//visual representation
	var out_abc = "";
	for(var i = 0; i < abc.length; i++)
		out_abc += mask[i] ? ("`1"+abc[i]+"` ") : ("-"+abc[i]+"- ");
	//attempt to decode
	var key= "";
	var i = nxt_high(0);
	i = nxt_low(i);
	var offset = i;
	if(offset == nxt_high(0) + args.s.length)
	{
		for(var i = offset; key.length < 3; i++)
			key += abc[i];
		return [key, out_abc];	
	}
	i = nxt_high(i);
	var low = i - offset;
	i = nxt_low(i);
	var high = i - low - offset;
	var rule = "Offset: " + offset + " Low:" + low + " High:" + high;
	//build the key
	var state = false; //low
	var step = low;
	for(var i = offset; i < abc.length && key.length < 3; i++)
	{
		if(mask[i] != state)
			key += abc[i];
		if(--step == 0)
		{
			step = state ? low : high;
			state = !state;
		}
	}
	return [key, out_abc, rule];
}
