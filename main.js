// @ts-check

// Constants -------------------------------------------------------------------

const prefix = 'item';
const delimiter = '-';
const idKey = 'id';
const orderKey = 'order';
const settingsKey = 'settings';
const typeEnum = {
    /** @type {'normal'} */
    normal: 'normal',
    /** @type {'favorite'} */
    favorite: 'favorite',
    /** @type {'archived'} */
    archived: 'archived',
}

// State -----------------------------------------------------------------------

/**
 * @typedef {('normal' | 'favorite' | 'archived')} ItemType
 * 
 * @typedef {Object} Item
 * @property {number} id
 * @property {string} text
 * @property {string[]} collections
 * @property {ItemType} type
 */

let maxId = 0;
/** @type {Item[]} */
let items = [];
/** @type {Map<number, Item>} */
const itemsMap = new Map();

const settings = {
    /** @type {'light' | 'dark'} */
    theme: 'light',
}

// Elements --------------------------------------------------------------------

/**
 * @param {string} id 
 * @return {HTMLElement | HTMLDialogElement}
 */
const getById = id => {
    const el = document.getElementById(id);
    if (el) return el;
    throw new Error(`Element not found (id = "${id}")`);
}

/**
 * @param {string} id 
 * @return {HTMLDialogElement}
 */
const getDialogById = id => {
    const el = document.getElementById(id);
    if (el instanceof HTMLDialogElement) return el;
    throw new Error(`Dialog not found (id = "${id}")`);
}

const main = getById('item-list');
const btnAdd = getById('btn-add');
const btnToggleTheme = getById('btn-toggle-theme');
const btnRemoveArchived = getById('btn-remove-archived');
const btnRemoveAll = getById('btn-remove-all');
const btnOptions = getById('btn-options');
const btnExport = getById('btn-export');
const btnImport = getById('btn-import');
const btnAbout = getById('btn-about');
const btnOptionsClose = getById('btn-options-close')
const btnAboutClose = getById('btn-about-close');
const dlgOptions = getDialogById('dlg-options');
const dlgAbout = getDialogById('dlg-about');
const dlgMessage = getDialogById('dlg-message');
const btnMessageClose = getById('btn-message-close');
const txtMessage = getById('txt-message');
const dlgProm = getDialogById('dlg-promt');
const txtPromtText = getById('txt-promt-text');
const btnPromtOk = getById('btn-promt-ok');
const btnPromtCancel = getById('btn-promt-cancel');
const dlgCollections = getDialogById('dlg-collections');
const btnAllCollections = getById('btn-all-collections');
const sectionCollections = getById('section-collections');
const btnCollections = getById('btn-collections');

/**
 * @param {Event} e 
 * @returns {HTMLElement | null}
 */
const getItemElFromEvent = e => {
    const target = e.target;
    return target instanceof Element
        ? target.parentElement?.closest('article') ?? null
        : null;
}

/**
 * @param {HTMLElement} el 
 * @return {Item}
 */
const getItemFromArticleEl = el => {
    const id = Number.parseInt(el?.dataset[idKey] ?? '');
    const item = itemsMap.get(id);
    if (!item)
        throw new Error(`Can't find item for element ${el}`);
    return item;
}

/**
 * @param {Event} e
 * @returns {Item}
 */
const getItemFromEvent = e => {
    const el = getItemElFromEvent(e);
    if (!el)
        throw new Error(`Can't find element for event target ${e.target}`);
    return getItemFromArticleEl(el);
}

/** @param {Event} e */
const itemInputHandler = e => {
    const item = getItemFromEvent(e);
    if (item && e.target instanceof HTMLElement) {
        const value = e.target.innerText;
        action.updateItemValue(item.id, value);
    }
}

/** @param {Item} item */
const updateItemType = (item) => {
    const itemElem = getById('item' + delimiter + item.id);
    itemElem.classList.remove(itemElem.classList[0]);
    itemElem.classList.add(item.type);

    const btnFavorite = getById('btn-favorite' + delimiter + item.id);
    btnFavorite.innerText = item.type === typeEnum.important
        ? 'Unfavorite' : 'Favorite';

    const btnArchive = getById('btn-archive' + delimiter + item.id);
    btnArchive.innerText = item.type === typeEnum.archived
        ? 'Unarchive' : 'Archive';
}

/** @param {Event} e */
const itemFavoriteHandler = e => {
    const item = getItemFromEvent(e);
    const isFavorite = item.type === typeEnum.favorite;
    const type = isFavorite ? typeEnum.normal : typeEnum.favorite;
    action.updateItemType(item.id, type);
}
/** @param {Event} e */
const itemArchiveHandler = e => {
    const item = getItemFromEvent(e);
    const isArchived = item.type === typeEnum.archived;
    const type = isArchived ? typeEnum.normal : typeEnum.archived;
    action.updateItemType(item.id, type);
}
/** @param {Event} e */
const itemRemoveHandler = e => {
    action.showPromt('Remove notes?', () => {
        const id = getItemFromEvent(e).id;
        action.removeItem(id);
    })
}

/** @type {string | null} */
let selectedCollection = null;

/** @type {HTMLElement | null} */
let selectedItem = null;

/** @param {Event} e */
const itemFocuseInHandler = e => {
    const itemEl = getItemElFromEvent(e);
    if (itemEl && itemEl !== selectedItem) {
        selectedItem?.removeAttribute('selected');
        selectedItem = itemEl;
        itemEl.setAttribute('selected', '');

        setTimeout(() => {
            const itemElBottom = itemEl.offsetTop + itemEl.clientHeight;
            if (itemElBottom > main.scrollHeight) {
                main.scrollTo(0, itemElBottom);
            }
        }, 10)
    }
}

/** @param {Item} item */
const addItemEl = item => {
    const { id, text } = item;
    const itemEl = document.createElement('article');
    itemEl.id = 'item' + delimiter + id;
    itemEl.dataset[idKey] = id.toString();
    itemEl.addEventListener('focusin', itemFocuseInHandler);
    const preEl = document.createElement('pre');
    preEl.innerText = text;
    preEl.setAttribute('contenteditable', 'plaintext-only');
    preEl.addEventListener('input', itemInputHandler);
    const footerEl = document.createElement('footer');
    const btnFavoriteEl = document.createElement('button');
    btnFavoriteEl.id = 'btn-favorite' + delimiter + id;
    btnFavoriteEl.title = 'Toggle note favorite';
    btnFavoriteEl.classList.add('favorite');
    onClick(btnFavoriteEl, itemFavoriteHandler)
    const btnArchiveEl = document.createElement('button');
    btnArchiveEl.id = 'btn-archive' + delimiter + id;
    btnArchiveEl.title = 'Toggle note archive state';
    btnArchiveEl.classList.add('archived');
    onClick(btnArchiveEl, itemArchiveHandler)
    const btnRemoveEl = document.createElement('button');
    btnRemoveEl.title = 'Remove note';
    btnRemoveEl.classList.add('remove');
    btnRemoveEl.innerText = 'Remove';
    onClick(btnRemoveEl, itemRemoveHandler)
    footerEl.appendChild(btnFavoriteEl);
    footerEl.appendChild(btnArchiveEl);
    footerEl.appendChild(btnRemoveEl);
    itemEl.appendChild(preEl);
    itemEl.appendChild(footerEl);

    main.appendChild(itemEl);

    updateItemType(item);

    setTimeout(() => {
        main.scrollTo(0, main.scrollHeight);
    }, 10);

    return itemEl;
}

const applyCollectionFilter = () => {
    const articles = document.querySelectorAll('article');
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const item = getItemFromArticleEl(article);
        article.style.display = !selectedCollection || item.collections.includes(selectedCollection)
            ? 'flex'
            : 'none';
    }
}

/** @param {Event} e */
const selectCollection = (e) => {
    const target = /** @type {HTMLButtonElement | null} */ (e.target);
    if (target) {
        selectedCollection = target.innerText;
        btnCollections.innerText = target.innerText;
        Array.from(target.parentElement?.children ?? []).forEach(element => {
            if (element.textContent === selectedCollection) {
                element.setAttribute('disabled', '');
            } else {
                element.removeAttribute('disabled');
            }
        });

        applyCollectionFilter();
    }
    dlgCollections.close();
}

const updateCollectionsEl = () => {
    const collections = new Set(items.flatMap(item => item.collections));
    if (collections.size) {
        sectionCollections.innerHTML = '';
        collections.forEach(collection => {
            const btnCollection = document.createElement('button');
            btnCollection.title = collection;
            btnCollection.innerText = collection;
            btnCollection.onclick = selectCollection;
            btnCollection.disabled = collection === selectedCollection;
            sectionCollections.appendChild(btnCollection);
        })
    }
}

/** @param {MouseEvent} e */
const dialogClickOutside = e => {
    if (!e.target) return;

    const target = /** @type {HTMLDialogElement} */ (e.target);
    const rect = target.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    const isClickInside =
        rect.top <= y && y <= rect.top + rect.height &&
        rect.left <= x && x <= rect.left + rect.width;

    if (!isClickInside) target.close();
}

// Actions ---------------------------------------------------------------------

const action = {
    initialize: () => {
        action.loadSettings();
        action.applySettings();
        action.loadItemsFromLocalStorage();
        action.setupHanlders();
    },

    setupHanlders: () => {
        onClick(btnAdd, () => action.addItem());
        onClick(btnOptions, () => dlgOptions.showModal());
        onClick(btnOptionsClose, () => dlgOptions.close());
        onClick(btnToggleTheme, action.toggleTheme);
        onClick(btnRemoveArchived, () =>
            action.showPromt('Remove archived notes?', action.removeArchivedItems)
        );
        onClick(btnRemoveAll, () =>
            action.showPromt('Remove all notes?', action.removeAllItems)
        );
        onClick(btnExport, action.export);
        onClick(btnImport, action.import);
        onClick(btnMessageClose, () => dlgMessage.close());
        onClick(btnAbout, () => dlgAbout.showModal());
        onClick(btnAboutClose, () => dlgAbout.close());
        onClick(dlgOptions, dialogClickOutside);
        onClick(dlgMessage, dialogClickOutside);
        onClick(dlgAbout, dialogClickOutside);
        onClick(dlgProm, dialogClickOutside);
        onClick(btnCollections, () => dlgCollections.showModal());
        onClick(dlgCollections, dialogClickOutside);
        onClick(btnAllCollections, () => {
            selectedCollection = null;
            btnCollections.innerText = 'All';
            applyCollectionFilter();
            dlgCollections.close();
        });
        onClick(btnPromtCancel, () => dlgProm.close());
    },

    loadSettings: () => {
        const rawSettings = localStorage.getItem(settingsKey);
        if (rawSettings) {
            const newSettings = JSON.parse(rawSettings);
            Object.keys(settings).forEach(key => {
                const value = newSettings[key];
                if (value) {
                    settings[key] = value;
                }
            })
        }
    },
    saveSettings: () => {
        localStorage.setItem(settingsKey, JSON.stringify(settings));
    },
    applySettings: () => {
        const isDarkTheme = settings.theme === 'dark';
        document.body.classList.toggle('dark-theme', isDarkTheme);
        btnToggleTheme.innerText = isDarkTheme ? 'Light theme' : 'Dark theme';
    },

    loadItemsFromLocalStorage: () => {
        const itemOrderIds = (localStorage.getItem(orderKey) ?? '')
            .split(delimiter)
            .reduce(
                /** @param {number[]} res */
                (res, rawId) => {
                    const id = Number.parseInt(rawId);
                    if (Number.isSafeInteger(id)) {
                        res.push(id);
                    }
                    return res;
                }, [])

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            if (!key) continue;

            const [rawPrefix, rawId, type = typeEnum.normal] = key.split(delimiter);

            if (rawPrefix !== prefix) continue;

            const id = Number.parseInt(rawId);
            const isValidId = Number.isSafeInteger(id) && id > 0;

            if (!isValidId) continue;

            if (id > maxId) {
                maxId = id;
            }

            const text = localStorage.getItem(key) ?? '';
            const collections = getCollectionsFromString(text);

            const item = {
                id,
                collections,
                text,
                type: /** @type {ItemType} */ (type),
            };

            itemsMap.set(id, item);
        }

        /** @type {HTMLElement=} */
        let lastEl;
        itemOrderIds.forEach(id => {
            const item = itemsMap.get(id);
            if (item) {
                items.push(item);
                lastEl = addItemEl(item);
            }
        });

        updateCollectionsEl();

        lastEl?.querySelector('pre')?.focus();
    },

    /** @param {Item} item */
    saveItemToLocalStorage: (item) => {
        const key = getItemKey(item);
        localStorage.setItem(key, item.text);
    },

    /** @param {Item} item */
    deleteItemFromLocalStorage: (item) => {
        const key = getItemKey(item);
        localStorage.removeItem(key);
    },

    saveOrderToLocalStorage: () => {
        localStorage.setItem(orderKey, items.map(item => item.id).join(delimiter));
    },

    /**
     * Create new item
     * Save item to LocalStorage
     * Add item to DOM
     * @param {{text: string, collections: string[], type: ItemType}=} data
     */
    addItem: (data) => {
        const { text = '', collections = [], type = typeEnum.normal } = data ?? {};
        const id = ++maxId;
        const item = {
            id,
            text,
            collections,
            type,
        };
        items.push(item);
        itemsMap.set(id, item);

        action.saveItemToLocalStorage(item);
        action.saveOrderToLocalStorage();

        updateCollectionsEl();

        addItemEl(item).querySelector('pre')?.focus();
    },

    /**
     * @param {number} id 
     * @param {string} text 
     */
    updateItemValue: (id, text) => {
        const item = itemsMap.get(id);
        if (item) {
            item.text = text;
            item.collections = getCollectionsFromString(text);
            action.saveItemToLocalStorage(item);
            updateCollectionsEl();
        }
    },

    /**
     * @param {number} id 
     * @param {ItemType} type 
     */
    updateItemType: (id, type) => {
        const item = itemsMap.get(id);
        if (item) {
            const oldKey = getItemKey(item);
            localStorage.removeItem(oldKey);

            item.type = type;
            const key = getItemKey(item);
            localStorage.setItem(key, item.text);

            updateItemType(item);
        }
    },

    removeItem: id => {
        const itemElem = getById('item' + delimiter + id);
        main.removeChild(itemElem);

        const item = itemsMap.get(id);
        if (item) {
            items.splice(items.findIndex(itemId => itemId === id), 1);
            itemsMap.delete(id);
            action.saveOrderToLocalStorage();
            action.deleteItemFromLocalStorage(item);
        }
    },

    removeArchivedItems: () => {
        items = items.filter(item => {
            if (item.type === typeEnum.archived) {
                const itemElem = getById('item' + delimiter + item.id);
                main.removeChild(itemElem);

                itemsMap.delete(item.id);

                action.deleteItemFromLocalStorage(item);

                return false;
            }
            return true;
        });
        action.saveOrderToLocalStorage();
    },

    removeAllItems: () => {
        localStorage.clear();
        main.innerHTML = '';
        maxId = 0;
        items.length = 0;
        itemsMap.clear();
    },

    export: () => {
        const date = new Date();
        const formatDateString =
            date.getFullYear().toString() + delimiter +
            (date.getMonth() + 1).toString().padStart(2, '0') + delimiter +
            date.getDate().toString().padStart(2, '0') + delimiter +
            date.getHours().toString().padStart(2, '0') + delimiter +
            date.getMinutes().toString().padStart(2, '0');
        const json = JSON.stringify(items, null, 2);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([json], { type: 'text/plain' }))
        a.setAttribute('download', `alesen-lite-export-${formatDateString}.json`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },
    import: () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = e => {
            if (e.target instanceof HTMLInputElement) {
                const file = e.target?.files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.readAsText(file);
                    reader.onload = e => {
                        try {
                            const content = e.target?.result;
                            if (typeof content === 'string') {
                                /** @type {Item[]} */
                                const items = JSON.parse(content);
                                items.forEach(item => {
                                    const { text, collections, type } = item;
                                    action.addItem({ text, collections, type: /** @type {ItemType} */ (type) });
                                });
                                updateCollectionsEl();
                            }
                        } catch (error) {
                            action.showMessage('Import failed with error: ' + error.message);
                        }
                    }
                }
            }
        }
        input.click();
    },

    /** @param {string} message */
    showMessage: message => {
        txtMessage.innerText = message;
        dlgMessage.showModal();
    },

    /** 
     * @param {string} text 
     * @param {Function} action
     */
    showPromt: (text, action) => {
        txtPromtText.innerText = text;
        dlgProm.showModal();
        btnPromtOk.onclick = () => {
            action();
            dlgProm.close();
            txtPromtText.innerText = '';
            btnPromtOk.onclick = null;
        }
    },

    toggleTheme: () => {
        settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
        action.applySettings();
        action.saveSettings();
    },
}

// Initialization --------------------------------------------------------------

action.initialize();

// Helpers ---------------------------------------------------------------------

/**
 * @param {HTMLElement} el 
 * @param {(e: MouseEvent) => void} handler 
 */
function onClick(el, handler) {
    el.addEventListener('click', handler);
}

/**
 * @param {string} text 
 * @returns {number}
 */
function getTextNewLineCount(text) {
    return text.split('\n').length;
}

/** @param {Item} item */
function getItemKey({ id, type }) {
    return [prefix, id, type].join(delimiter);
}

/** @param {string} text */
function getCollectionsFromString(text) {
    const collectionsRegex = /#([1-9A-Za-z-_]+)/g;
    return text.match(collectionsRegex)?.map(value => value) ?? [];
}
