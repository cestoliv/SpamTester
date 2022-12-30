HTML_server_input = document.getElementById("server-input");
HTML_hide_null_errors = document.getElementById("hide-null-errors");
HTML_reset_button = document.getElementById("reset-button");

function restoreOptions() {
	let storageItem = browser.storage.sync.get(['server', 'hide_null_errors']);
	storageItem.then((res) => {
		HTML_server_input.value = res.server || 'https://spamtester.chevro.fr';
		HTML_hide_null_errors.checked = res.hide_null_errors || true;
	});
}

document.addEventListener('DOMContentLoaded', restoreOptions);

HTML_hide_null_errors.addEventListener("change", (e) => {
	browser.storage.sync.set({
		hide_null_errors: HTML_hide_null_errors.checked
	});
});

HTML_server_input.addEventListener("change", (e) => {
	browser.storage.sync.set({
		server: HTML_server_input.value
	});
});

HTML_reset_button.addEventListener("click", (e) => {
	browser.storage.sync.clear();
	restoreOptions();
});
