function setupCounter(buttonId, counterId, storageKey) {
  const btn = document.getElementById(buttonId);
  const counter = document.getElementById(counterId);

  let count = parseInt(localStorage.getItem(storageKey)) || 0;
  counter.textContent = count;

  btn.addEventListener("click", () => {
    count++;
    counter.textContent = count;
    localStorage.setItem(storageKey, count);
  });
}

// Setup untuk tiap addon
setupCounter(
  "downloadBtnZeroTotem",       // tombol
  "downloadCounterZeroTotem",   // span counter
  "countZero3DTotem"            // localStorage key
);
setupCounter("downloadBtnElemental", "downloadCounterElemental", "countElemental");