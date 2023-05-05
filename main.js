let src = document.getElementById("src");
let output = document.getElementById("output");
let copy = document.getElementById("copy");
let resets = document.getElementById("resets");
const Toast = Swal.mixin({
	toast: true,
	position: "top-end",
	showConfirmButton: false,
	timer: 1000,
	timerProgressBar: true,
	didOpen: (toast) => {
		toast.addEventListener("mouseenter", Swal.stopTimer);
		toast.addEventListener("mouseleave", Swal.resumeTimer);
	},
});

copy.onclick = copy_run;

function copy_run() {
	output.select();
	document.execCommand("copy");

	Toast.fire({
		icon: "success",
		title: "Schema copied",
	});
}

resets.onclick = function () {
	src.value = "";
	src.focus();
};

src.onkeyup = _.debounce(convert,1000);

function convert() {
	if (src.value.length) {
		src.value = src.value.replace(/^\s+|\s+$/gm, "");
		let entry = src.value;
		if(entry[entry.length-1] == ','){
			entry = entry.substring(0, entry.length-1);
		}
		entry = entry.split(",\n").map((i) => i.replace(/(\r\n|\n|\r)/gm, ""));

		let query = entry.map((i) => {
			let str = get_data_type(i);
			str += get_null(i);
			str += get_default(i);
			str += get_comment(i);
			str += ";";
			return str;
		});

		output.value = query.join("\n");
		console.log(query);
		copy_run();
	}
}

function get_data_type(i) {
	let perfix = `$table->`;
	let col_name = i.split(" ")[0].replaceAll("`", '"');
	let data_type = i.split(" ")[1].toLowerCase();
	let var_char_len = 0;
	if (data_type) {
		console.log(data_type);
		if (data_type.includes("varchar")) {
			var_char_len = var_char(data_type);
			data_type = "varchar";
		}
		if (data_type.includes("double")) {
			data_type = "double";
		}
		switch (data_type) {
			case "int":
				perfix += `integer(${col_name})`;
				break;
			case "bigint":
				perfix += `bigInteger(${col_name})`;
				if (col_name.includes("id")) {
					perfix += `->unsigned()`;
				}
				break;
			case "tinyint":
				perfix += `tinyInteger(${col_name})`;
				break;
			case "float":
				perfix += `float(${col_name})`;
				break;
			case "double":
				perfix += `double(${col_name})`;
				break;
			case "varchar":
				perfix += `string(${col_name},${var_char_len})`;
				break;
			case "text":
				perfix += `text(${col_name})`;
				break;
			case "tinytext":
				perfix += `tinyText(${col_name})`;
				break;
			case "longtext":
				perfix += `longText(${col_name})`;
				break;
			case "date":
				perfix += `date(${col_name})`;
				break;
			case "time":
				perfix += `time(${col_name})`;
				break;
			case "datetime":
				perfix += `dateTime(${col_name})`;
				break;
			case "timestamp":
				perfix += `timestamp(${col_name})`;
				break;
		}
	}
	return perfix;
}

function get_null(i) {
	i = i.toUpperCase();
	return !i.includes("NOT NULL") && (i.includes("NULL") || i.includes("DEFAULT NULL") || !i.includes("DEFAULT")) ? "->nullable()" : "";
}

function get_default(i) {
	let str = i.toUpperCase();
	if (!str.includes("DEFAULT NULL") && str.includes("DEFAULT")) {
		let arr = i.split(" ");
		let default_value = arr[arr.findIndex((i) => i.toUpperCase() == "DEFAULT") + 1];
		return `->default(${default_value.replaceAll("'", '"')})`;
	}
	return "";
}

function get_comment(i) {
	let str = i.toUpperCase();
	if (str.includes("COMMENT")) {
		let arr = i.split("COMMENT");
		let default_value = arr[1];
		return `->comment(${default_value.replaceAll("'", '"')})`;
	}
	return "";
}

function var_char(str) {
	const start = str.indexOf("(") + 1; // find the index of the opening parenthesis and add 1 to exclude it
	const end = str.indexOf(")"); // find the index of the closing parenthesis
	const len = str.substring(start, end); // extract the value using the substring method
	return len;
}
