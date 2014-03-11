// Bencode Library 
// Copyright 2014 Steven Goodwin
// Released under the GPL, version 2

// For format details, please see:
// http://en.wikipedia.org/wiki/Bencode

bencode = function() {
	this.STATE_NULL = 0;
	this.STATE_INTEGER = 1;				// i-?[0-9]e
	this.STATE_STRING_LENGTH = 2;		// [0-9]+:\a+
	this.STATE_STRING_CONTENT = 3;		// [0-9]+:\a+
	this.STATE_LIST = 4;				// l<contents>e
	this.STATE_DICTIONARY = 5;			// d<contents>e
}

// Parse accepts an array of characters to process, and the index of the
// first character to parse.
// It returns an object containing the parsed result (in result.o), and the index
// of the next character to parse in result.idx
bencode.prototype.parse = function(dataArray, fromIndex) {
	var length = dataArray.byteLength;
	var idx = fromIndex;
	var state = this.STATE_NULL;

	// State data
	var current = "";
	var currentObject = null;;
	// String-specific state data
	var stringLength;
	
	while(idx < length) {
		var c = String.fromCharCode(dataArray[idx]) ;
		
		switch(state) {
			case this.STATE_NULL:
					switch(c) {
						case 'i':
								state = this.STATE_INTEGER;
								current = "";
								break;
						case '0':
						case '1':
						case '2':
						case '3':
						case '4':
						case '5':
						case '6':
						case '7':
						case '8':
						case '9':
								state = this.STATE_STRING_LENGTH;
								current = c;
								break;
						case 'l':
								currentObject = new Array();
								state = this.STATE_LIST;
								break;
								
						case 'd':
								currentObject = new Object();
								state = this.STATE_DICTIONARY;
								break;

						default:
								return null;
						}
					//
					++idx;
					break;
					
			case this.STATE_INTEGER:	
					switch(c) {
						case '-':	// we assume that negative numbers start with -
								current = "-";
								break;
						case 'e':
								return { o : current, idx : idx+1 };
						case '0':
						case '1':
						case '2':
						case '3':
						case '4':
						case '5':
						case '6':
						case '7':
						case '8':
						case '9':
								current += c;
								break;
					}
					++idx;
					break;
					
			case this.STATE_STRING_LENGTH:	
					switch(c) {
						case ':':	// the separator between length and content
								stringLength = parseInt(current, 10);
								state = this.STATE_STRING_CONTENT;
								current = "";		// We now parse the string content
								break;
						case '0':
						case '1':
						case '2':
						case '3':
						case '4':
						case '5':
						case '6':
						case '7':
						case '8':
						case '9':
								current += c;
								break;
						default:
								return null;
						
					}
					++idx;
					break;
					
				case this.STATE_STRING_CONTENT:
					current += c;
					if (--stringLength == 0) {
						return { o : current, idx : idx+1 };
					}

					++idx;
					break;
											
				case this.STATE_DICTIONARY:
					
					if (c == 'e') {
						return { o : currentObject, idx : idx+1 };
					} else {
						var objKey = this.parse(dataArray, idx);
						var objValue = this.parse(dataArray, objKey.idx);
						
						currentObject[objKey.o] = objValue.o;
						idx = objValue.idx;
					}
					break;
					
				case this.STATE_LIST:
					
					if (c == 'e') {
						return { o : currentObject, idx : idx+1 };
					} else {
						var obj = this.parse(dataArray, idx);
						
						currentObject.push(obj.o);
						idx = obj.idx;
					}
					break;
				
		}
	}
	
	return null;
}

bencode.prototype.decode = function(byteArray) {
	var dataArray = new Uint8Array(byteArray);
	var result = this.parse(dataArray, 0);
	
	return result.o;
}
