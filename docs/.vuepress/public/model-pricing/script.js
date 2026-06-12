const icons = {
  auto: { key: "auto", src: "./img/gpt.svg" },
  gpt: { key: "gpt", src: "./img/gpt.svg" },
  claude: { key: "claude", src: "./img/claude.svg" },
  google: { key: "google", src: "./img/google.svg" },
  deepseek: { key: "deepseek", src: "./img/deepseek.svg" },
};

const cnyAmountInput = document.querySelector("#cnyAmount");
const usdAmountInput = document.querySelector("#usdAmount");
const exchangeRateDisplay = document.querySelector("#exchangeRate");
const cardStack = document.querySelector("[data-card]");
const nameInput = cardStack.querySelector('[data-bind="nameInput"]');
const iconPreview = cardStack.querySelector('[data-bind="iconPreview"]');
const iconMirror = cardStack.querySelector('[data-bind="iconMirror"]');
const nameMirror = cardStack.querySelector('[data-bind="nameMirror"]');
const inputDisplay = cardStack.querySelector('[data-bind="inputDisplay"]');
const outputDisplay = cardStack.querySelector('[data-bind="outputDisplay"]');
const cacheDisplay = cardStack.querySelector('[data-bind="cacheDisplay"]');
const priceInputs = cardStack.querySelectorAll('.price-input');
const iconToggleButton = cardStack.querySelector('[data-action="toggleIconPanel"]');
const iconMenu = cardStack.querySelector('[data-bind="iconMenu"]');
const iconOptions = cardStack.querySelectorAll('.icon-option');

const formatCurrency = (value) => `¥${value.toFixed(4)} / 1M Tokens`;
const formatRate = (value) => `¥${value.toFixed(4)}`;
const sanitizeNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const getExchangeRate = () => {
  const cnyAmount = sanitizeNumber(cnyAmountInput.value);
  const usdAmount = sanitizeNumber(usdAmountInput.value);
  return usdAmount > 0 ? cnyAmount / usdAmount : 0;
};

const detectAutoIconMode = (modelName) => {
  const normalizedName = modelName.toLowerCase();

  if (normalizedName.includes("gpt")) {
    return "gpt";
  }
  if (normalizedName.includes("claude")) {
    return "claude";
  }
  if (normalizedName.includes("gemini")) {
    return "google";
  }
  if (normalizedName.includes("deepseek")) {
    return "deepseek";
  }

  return "gpt";
};

const getResolvedIconMode = (modelName) => {
  const selectedMode = cardStack.dataset.iconMode || "auto";
  return selectedMode === "auto" ? detectAutoIconMode(modelName) : selectedMode;
};

const updateActiveOption = () => {
  const selectedMode = cardStack.dataset.iconMode || "auto";
  iconOptions.forEach((option) => {
    option.classList.toggle("is-active", option.dataset.iconMode === selectedMode);
  });
};

const closeIconMenu = () => {
  iconMenu.hidden = true;
  iconToggleButton.setAttribute("aria-expanded", "false");
};

const toggleIconMenu = () => {
  const willOpen = iconMenu.hidden;
  iconMenu.hidden = !willOpen;
  iconToggleButton.setAttribute("aria-expanded", String(willOpen));
};

const syncCard = (exchangeRate) => {
  const modelName = nameInput.value.trim() || "未命名模型";
  const resolvedMode = getResolvedIconMode(modelName);
  const currentIcon = icons[resolvedMode] || icons.gpt;

  iconPreview.src = currentIcon.src;
  iconMirror.src = currentIcon.src;
  iconPreview.alt = `${modelName} 图标`;
  iconMirror.alt = `${modelName} 图标`;
  nameMirror.textContent = modelName;
  updateActiveOption();

  const priceValues = { input: 0, output: 0, cache: 0 };
  priceInputs.forEach((input) => {
    priceValues[input.dataset.field] = sanitizeNumber(input.value);
  });

  inputDisplay.textContent = formatCurrency(priceValues.input * exchangeRate);
  outputDisplay.textContent = formatCurrency(priceValues.output * exchangeRate);
  cacheDisplay.textContent = formatCurrency(priceValues.cache * exchangeRate);
};

const updateAll = () => {
  const exchangeRate = getExchangeRate();
  exchangeRateDisplay.textContent = formatRate(exchangeRate);
  syncCard(exchangeRate);
};

[cnyAmountInput, usdAmountInput].forEach((input) => {
  input.addEventListener("input", updateAll);
});

nameInput.addEventListener("input", updateAll);
priceInputs.forEach((input) => {
  input.addEventListener("input", updateAll);
});

iconToggleButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleIconMenu();
});

iconOptions.forEach((option) => {
  option.addEventListener("click", () => {
    cardStack.dataset.iconMode = option.dataset.iconMode;
    closeIconMenu();
    updateAll();
  });
});

document.addEventListener("click", (event) => {
  if (!cardStack.querySelector('[data-bind="iconPicker"]').contains(event.target)) {
    closeIconMenu();
  }
});

updateAll();
