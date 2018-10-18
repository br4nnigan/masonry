var Hammer = require("hammerjs");
var transition = require("css-transition");
var Static = require("Static.js");
var DomUtils = Static.dom;
var Promise = require("promise-polyfill");

function Masonry( element, opts ) {

	var containerItems = null;
	var columns = null;
	var filter = null;
	var categories = null;
	var category = "";
	var labels = {
		ALL: "all"
	}
	var options = {};
	var classes = {
		FILTER: "masonry--filter",
		INITIALIZED: "masonry--initialized",
		CATEGORY: "masonry--filter__category",
		CATEGORY_ACTIVE: "masonry--filter__category--active",
		ITEM: "masonry--item",
		ITEM_HIDDEN: "masonry--item--hidden",
		ITEM_PLACEHOLDER: "masonry--item--placeholder"
	}

	var styles = {
		"visible": {
			opacity: 1,
			transform: "scale(1)"
		},
		"hidden": {
			opacity: 0,
			transform: "scale(0.8)"
		}
	}

	var hammerInstances = [];

	var api = Object.create(Masonry);
		api.getItems = getItems;
		api.destroy = removeGlobalListeners;
		api.getColumns = function () {
			return columns || 0;
		}
		api.setOption = function (key, value) {
			options[key] = value;
		}

	function initialize() {

		options = opts || options;

		if ( !(element instanceof Element) ) {

			return;
		}

		var items = getItems(true);

		if ( !items.length ) return;

		containerItems = items[0].parentNode;

		if ( !containerItems ) return;

		if ( typeof options.staticLayout != "boolean" ) {

			options.staticLayout = containerItems.classList.contains("masonry--items--static");
		}
		if ( typeof options.sameHeight != "boolean" ) {

			options.sameHeight = containerItems.classList.contains("masonry--items--sameheight");
		}

		if ( Array.isArray(options.plugins) ) {
			Static.each(options.plugins, function (plugin) {
				plugin( api );
			});
		}

		initializeFilter( items );

		columns = getColumns();
		update();

		Static.each(items, function (item) {
			DomUtils.style(item, styles.hidden);
			var itemImages = item.querySelectorAll("img");
			if (itemImages) {
				Static.each(itemImages, function (img) {
					img.addEventListener("load", onImageLoad);
				});
			}

			if ( !options.staticLayout ) {

				if ( !item.nextSibling ) {
					containerItems.appendChild(document.createTextNode(" "));
				} else if ( item.nextSibling.nodeType != 3 ) {
					containerItems.insertBefore(document.createTextNode(" "), item.nextSibling);
				}
			}
		});

		element.classList.add(classes.INITIALIZED);

		Promise.all(
			items.map(function (item) {
				return transition(item, styles.visible, 300);
			})
		).then(update);

		addGlobalListeners();
	}

	function addGlobalListeners() {
		window.addEventListener("resize", onWindowResize);
	}

	function removeGlobalListeners() {
		window.removeEventListener("resize", onWindowResize);
		hammerInstances = hammerInstances.filter(function (hammer) {
			if ( hammer ) {
				hammer.destroy();
			}
		});
	}

	function initializeFilter( items ) {

		if ( items && containerItems && element ) {

			categories = [];

			Static.each(items, function (item) {
				var category = item.getAttribute("data-category");
				if ( category && categories.indexOf(category) === -1 ) {
					categories.push(category);
				}
			});

			if ( categories.length > 1 ) {

				var filterContainer = document.createElement("div");
					filterContainer.className = classes.FILTER;

				categories.push( labels.ALL );
				categories = categories.sort().reverse();

				for (var i = 0, hammer; i < categories.length; i++) {
					category = document.createElement("div");
					category.classList.add(classes.CATEGORY);
					category.textContent = categories[i];
					category.setAttribute("data-category", categories[i]);
					hammer = new Hammer(category).on("tap", onCategoryClick );
					hammerInstances.push(hammer);
					filterContainer.appendChild(category);
				}
				categories = Array.prototype.slice.call(filterContainer.childNodes);

				setActiveCategory(labels.ALL);
				element.insertBefore(filterContainer, element.childNodes[0])
			}
		}
	}

	function update() {

		if ( !document.body.contains(element) ) {
			removeGlobalListeners();
			return false;
		}

		justifyFix();
		layout();
		flowFix();
	}

	function getColumns() {

		var items = getItems(true, true);
		var columns = 0;

		if ( items.length ) {

			var item = items[0];
			var firstItemOffset = items[0].offsetTop;

			while ( item && (item.offsetTop - (parseInt(item.style.marginTop) || 0)) === firstItemOffset ) {
				columns++;
				addPlaceHolder(items);
				items = getItems(true, true);
				item = items[columns];
			}
			removePlaceholders();
		}
		return columns;
	}

	function justifyFix() {

		var items = getItems();

		if ( items.length % columns != 0 ) {
			removePlaceholders();

			for (var i = 0; i < columns - (items.length % columns); i++) {
				addPlaceHolder(items);
			}
		}

		Static.each(containerItems.childNodes, function (node) {

			if ( node.nodeType === 3 ) {

				if ( options.staticLayout ) {

					// remove text node
					node.parentNode.removeChild( node );
					return;
				}
				node.textContent = " ";

				if ( node.nextSibling && node.nextSibling.nodeType === 3 ) {
					// avoid 2 adjacent text nodes
					node.nextSibling.parentNode.removeChild( node.nextSibling );
				}
			}

			if ( node.nodetype === 1 ) {

				if ( !options.staticLayout && node.nextSibling && node.nextSibling.nodeType === 1 ) {

					// add missing text node
					node.parentNode.insertBefore(document.createTextNode(" "), node.nextSibling);
				}
			}
		});
	}

	function addPlaceHolder(items) {

		items = items || getItems();

		var el = document.createElement("DIV");
			el.className = items.length ? items[0].className : classes.ITEM;
			el.classList.add(classes.ITEM_PLACEHOLDER);
			el.style.visibility = "hidden";

		if ( !options.staticLayout && containerItems.lastChild.nodeType != 3 ) {
			containerItems.appendChild(document.createTextNode(" "));
		}
		containerItems.appendChild(el);
	}

	function flowFix() {

		var itemsLastRow = [];
		var items = getItems( true );

		for (var i = 0, child; i < items.length; i++) {

			child = items[i];
			if ( i >= items.length - columns) {
				itemsLastRow.push({
					element: child,
					offset: parseInt(child.style.marginTop) || 0,
					placeholder: child.classList.contains(classes.ITEM_PLACEHOLDER)
				});
			}
		}

		for (var i = 0, child, item; i < itemsLastRow.length; i++) {

			child = itemsLastRow[i];

			if ( !child.placeholder && !item ) {

				item = child;

			} else if ( child.placeholder && item ) {
// console.log(child.offset , item.offset);
				if ( child.offset < item.offset ) {

					DomUtils.swapChildren(child.element, item.element);

					layout();
					flowFix();
					break;
				}
			}
		}
	}

	function getItems( includePlaceholders, includeHidden ) {

		var query = "." + classes.ITEM;

		if ( !includeHidden ) {
			query += ":not(." + classes.ITEM_HIDDEN + ")";
		}
		if ( !includePlaceholders ) {
			query += ":not(." + classes.ITEM_PLACEHOLDER + ")";
		}

		var items = element.querySelectorAll(query);

		return Array.prototype.map.call(items, function(item) {
			return item;
		});
	}

	function removePlaceholders() {

		Static.each(containerItems.querySelectorAll("." + classes.ITEM_PLACEHOLDER), function (placeholder) {
			placeholder.parentNode.removeChild(placeholder);
		});
	}

	function layout(reset) {

		if ( options.staticLayout ) return;

		var items = getItems(true);

		if ( options.sameHeight ) {

			layoutHeight(items, reset)
			return;
		}

		layoutVerticalPosition(items, reset);
	}

	function layoutHeight(items, reset) {

		var len = items.length;

		Static.each(items, function (item, i) {
			item.style.minHeight = "";
		});

		if ( reset ) return;

		Static.each(items, function (item, i) {

			// at first item of row...
			if ( i%columns === 0 ) {

				// get items of this row
				var rowItems = items.slice(i, i + columns);

				// get highest height
				var h = Math.max.apply(null, rowItems.map(function(item){
					return item.offsetHeight
				}));

				// apply height to row items
				Static.each(rowItems, function (item) {
					item.style.minHeight = h + "px";
				});
				// console.log("h", h, "rowitems", rowItems );
			}
		});
	}

	function layoutVerticalPosition(items, reset) {

		// console.log("layoutVerticalPosition", items, reset, columns);

		Static.each(items, function (item, i) {

			if ( columns === 1 || i < columns || reset) {
				item.style.marginTop = "";
			}

			if ( i < columns ) return;

			var itemAbove = items[i - columns];
			var curr = parseInt(item.style.marginTop) || 0;
			var dif = Math.floor(item.offsetTop - itemAbove.offsetTop - itemAbove.offsetHeight - parseInt(getComputedStyle(itemAbove).getPropertyValue("margin-bottom")));
			// console.log("layout", curr - dif, curr, dif, item, itemAbove, item.offsetTop, itemAbove.offsetTop, itemAbove.offsetHeight);
			item.style.marginTop =  (curr - dif) + "px";
		});
	}

	function setActiveCategory(value) {
		// console.log("setActiveCategory", value);
		categories.map(function (category) {
			if ( category.textContent == value ) {
				element.setAttribute("data-category", value);
				category.classList.add(classes.CATEGORY_ACTIVE);
			} else {
				category.classList.remove(classes.CATEGORY_ACTIVE);
			}
		});

	}

	function onCategoryClick(e) {

		if ( typeof options.onBeforeCategoryChange == "function" ) {
			options.onBeforeCategoryChange();
		}
		var selected = e.target.textContent;

		if ( selected != category ) {

			setActiveCategory(selected);

			var items = getItems();

			Promise.all(
				items.map(function (item) {
					return transition(item, styles.hidden, 200);
				})
			).then(function () {

				category = selected;

				items = getItems(false, true).filter(setItemVisibility);

				update();

				Promise.all(
					items.map(function (item) {
						return transition(item, styles.visible, 200);
					})
				);
			});
		}
	}

	function setItemClass(item) {

		item.classList.add(classes.ITEM);
	}

	function setItemVisibility(item) {

		var itemCategory = item.getAttribute("data-category");

		if ( itemCategory != category && category != labels.ALL ) {
			item.classList.add(classes.ITEM_HIDDEN);
			return false;
		}
		item.classList.remove(classes.ITEM_HIDDEN);
		return true;

	}

	function onImageLoad() {

		layout();
	}

	function onWindowResize() {

		columns = getColumns();
		update();
	}

	return initialize(), api;
}
if ( typeof module == "object" ) {
	module.exports = Masonry;
}

