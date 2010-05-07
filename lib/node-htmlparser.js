/*global exports, require */

var sys = require('sys'),
    ElementType = {
        Text: 'text',
        Tag: 'tag',
        Directive: 'directive',
        Comment: 'comment',
        Script: 'script', 
        Style: 'style'
    },
    emptyTags = {
        area: 1,
        base: 1,
        basefont: 1,
        br: 1,
        col: 1,
        frame: 1,
        hr: 1,
        img: 1,
        input: 1,
        isindex: 1,
        link: 1,
        meta: 1,
        param: 1,
        embed: 1
    },
    reTrim = /(^\s+|\s+$)/gm,
    reTrimTag = /\s*\/\s*$/gm,
    reTrimEndTag = /^\s*\/\s*/gm,
    reTrimComment = /(^\!--|--$)/g;


function StringTagFind (data, offset) {
	var start, end;
    start = data.indexOf("<", offset);
	end = data.indexOf(">", offset);
	return((start < end) ? start : end);
}

function NestTags (elements) {
	var nested = [],
	    idxEnd = elements.length,
	    idx = 0,
        element, baseName, pos,
	    tagStack = [];

	tagStack.last = function last () {
		return(this.length ? this[this.length - 1] : null);
	};

	while (idx < idxEnd) {
		element = elements[idx++];


		if (!tagStack.last()) {
			if (element.type != ElementType.Text && element.type != ElementType.Comment && element.type != ElementType.Directive) {
				if (element.name[0] != "/") {
					nested.push(element);
					if (!emptyTags[element.name]) {
						tagStack.push(element);
					}
				}
			} else {
				nested.push(element);
            }
		} else {
            //sys.puts('nest: ' + element.data);
			if (element.type != ElementType.Text && element.type != ElementType.Comment && element.type != ElementType.Directive) {
                //sys.puts('nest1: ' + element.data);
				if (element.name[0] == "/") {
					baseName = element.name.substring(1);
					if (!emptyTags[baseName]) {
						pos = tagStack.length - 1;
						while (pos > -1 && tagStack[pos--].name != baseName) { }
						if (pos > -1 || tagStack[0].name == baseName) {
							while (pos < tagStack.length - 1) {
								tagStack.pop();
                            }
                        }
					}
				} else {
                    //sys.puts('nest2: ' + element.data);
					//if (!emptyTags[element.name]) {
						if (!tagStack.last().children) {
							tagStack.last().children = [];
                        }
						tagStack.last().children.push(element);
						tagStack.push(element);
					//}
				}
			} else {
                //sys.puts('nest3: ' + element.data);
				if (!tagStack.last().children) {
					tagStack.last().children = [];
                }
				tagStack.last().children.push(element);
			}
		}
	}

	return(nested);
}

function ParseAttribs (element) {
	var tagName = element.data.split(/\s/, 1)[0],
        reAttrib, match,
	    attribRaw = element.data.substring(tagName.length);
	
    if (attribRaw.length < 1) {
		return;
    }

	reAttrib = /([^=<>\"\'\s]+)\s*=\s*"([^"]*)"|([^=<>\"\'\s]+)\s*=\s*'([^']*)'|([^=<>\"\'\s]+)\s*=\s*([^'"\s]+)|([^=<>\"\'\s\/]+)/g;

	while (match = reAttrib.exec(attribRaw)) {
		if (!element.attribs) {
			element.attribs = {};
        }

		if (typeof match[1] == "string") {
			element.attribs[match[1]] = match[2];
		} else if (typeof match[3] == "string") {
			element.attribs[match[3]] = match[4];
		} else if (typeof match[5] == "string") {
			element.attribs[match[5]] = match[6];
		} else if (typeof match[7] == "string") {
			element.attribs[match[7]] = match[7];
        }
	}
}

function ParseTagAttribs (elements) {
	var idxEnd = elements.length,
	    idx = 0, element;

	while (idx < idxEnd) {
		element = elements[idx++];
		if (element.type != ElementType.Tag && element.type != ElementType.Script && element.type != ElementType.style) {
			continue;
        }
		ParseAttribs(element);
	}

	return(elements);
}

function ParseTagName (data) {
	return(data.replace(reTrimEndTag, "/").replace(reTrimTag, "").split(' ').shift().toLowerCase());
}

function ParseTags (data) {
	var elements = [],
	    reTags = /[\<\>]/g,
        current = 0,
        next = 0,
        end = data.length - 1,
        state = ElementType.Text,
        tagSep, rawData, element, elementName, prevElement, rawLen,
        tagStack = [];

	while (reTags.test(data)) {
		next = reTags.lastIndex - 1;
		tagSep = data[next];
		rawData = data.substring(current, next);

		element = {
		    raw: rawData,
			data: (state == ElementType.Text) ? rawData : rawData.replace(reTrim, ""),
			type: state
		};

		elementName = ParseTagName(element.data);
		if (tagStack.length) {
			if (tagStack[tagStack.length - 1] == ElementType.Script) {
				if (elementName == "/script") {
					tagStack.pop();
				} else {
					if (element.raw.indexOf("!--") !== 0) {
						element.type = ElementType.Text;
						if (elements.length && elements[elements.length - 1].type == ElementType.Text) {
							if (element.raw !== "") {
								prevElement = elements[elements.length - 1];
								prevElement.raw = prevElement.data = prevElement.raw + element.raw + tagSep;
								element.raw = element.data = "";
							}
						} else {
							if (element.raw !== "") {
								element.raw = element.data = element.raw + tagSep;
                            }
                        }
					}
				}
			} else if (tagStack[tagStack.length - 1] == ElementType.Style) {
				if (elementName == "/style") {
					tagStack.pop();
				} else {
					if (element.raw.indexOf("!--") !== 0) {
						element.type = ElementType.Text;
						if (elements.length && elements[elements.length - 1].type == ElementType.Text) {
							if (element.raw !== "") {
								prevElement = elements[elements.length - 1];
								prevElement.raw = prevElement.data = prevElement.raw + element.raw + tagSep;
								element.raw = element.data = "";
							}
						} else {
							if (element.raw !== "") {
								element.raw = element.data = element.raw + tagSep;
                            }
                        }
					}
				}
			} else if (tagStack[tagStack.length - 1] == ElementType.Comment) {
				rawLen = element.raw.length;
				if (element.raw[rawLen - 1] == "-" && element.raw[rawLen - 1] == "-" && tagSep == ">") {
					tagStack.pop();
					if (elements.length && elements[elements.length - 1].type == ElementType.Comment) {
						prevElement = elements[elements.length - 1];
						prevElement.raw = prevElement.data = (prevElement.raw + element.raw).replace(reTrimComment, "");
						element.raw = element.data = "";
						element.type = ElementType.Text;
					} else {
						element.type = ElementType.Comment;
                    }
				} else {
					element.type = ElementType.Comment;
					if (elements.length && elements[elements.length - 1].type == ElementType.Comment) {
						prevElement = elements[elements.length - 1];
						prevElement.raw = prevElement.data = prevElement.raw + element.raw + tagSep;
						element.raw = element.data = "";
						element.type = ElementType.Text;
					} else {
						element.raw = element.data = element.raw + tagSep;
                    }
				}
			} else {
				//TODO: ???
			}
		}

		if (element.type == ElementType.Tag) {
			element.name = elementName;
			
			if (element.raw.indexOf("!--") === 0) {
				element.type = ElementType.Comment;
				delete element.name;
				rawLen = element.raw.length;
				if (element.raw[rawLen - 1] == "-" && element.raw[rawLen - 2] == "-" && tagSep == ">") {
					element.raw = element.data = element.raw.replace(reTrimComment, "");
				} else {
					element.raw += tagSep;
					tagStack.push(ElementType.Comment);
				}
			} else if (element.raw.indexOf("!") === 0) {
				element.type = ElementType.Directive;
				//TODO: what about CDATA?
			} else if (element.name == "script") {
				element.type = ElementType.Script;
				if (element.data[element.data.length - 1] != "/") {
					tagStack.push(ElementType.Script);
                }
			} else if (element.name == "/script") {
				element.type = ElementType.Script;
			} else if (element.name == "style") {
				element.type = ElementType.Style;
				if (element.data[element.data.length - 1] != "/") {
					tagStack.push(ElementType.Style);
                }
			} else if (element.name == "/style") {
				element.type = ElementType.Style;
            }
			if (element.name && element.name[0] == "/") {
				element.data = element.name;
            }
		}

		if (element.raw !== "" || element.type != ElementType.Text) {
			elements.push(element);
			if (element.type != ElementType.Text &&
				element.type != ElementType.Comment &&
				element.type != ElementType.Directive &&
				element.data[element.data.length - 1] == "/" ) {
				elements.push({
				    raw: "/" + element.name,
					data: "/" + element.name,
					name: "/" + element.name,
				    type: element.type
				});
            }
		}
		state = (tagSep == "<") ? ElementType.Tag : ElementType.Text;
		current = next + 1;
	}
	if (current < end) {
		rawData = data.substring(current);
		element = {
			raw: rawData,
			data: (state == ElementType.Text) ? rawData : rawData.replace(reTrim, ""),
		    type: state
		};

		if (state == ElementType.Tag || state == ElementType.Script || state == ElementType.Style) {
			element.name = ParseTagName(element.data);
        }
		elements.push(element);
	}

	return(elements);
}

exports.ParseHtml = function ParseHtml (data) {
	return(NestTags(ParseTagAttribs(ParseTags(data))));
};

exports.ElementType = ElementType;
