function saveOptions(e) {
	browser.storage.sync.set({
		server: document.getElementById("server-input").value
	});
	e.preventDefault();
}

function restoreOptions() {
	let storageItem = browser.storage.sync.get('server');
	storageItem.then((res) => {
		document.getElementById("server-input").value = res.server;
	});
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
