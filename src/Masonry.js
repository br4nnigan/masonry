var transition = require("css-transition");
var Static = require("Static.js");
var DomUtils = Static.dom;
var Promise = require("promise-polyfill");

function Masonry( element, opts ) {

	var containerItems = null;
	var justifyFixDiv = null;
	var columns = null;
	var filter = null;
	var categories = null;
	var whitespace = null;
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
		JUSTIFY_FIX: "masonry--justifyfix",
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

	var api = Object.create(Masonry);
		api.getItems = getItems;
		api.destroy = removeGlobalListeners;
		api.getColumns = function () {
			return columns || 0;
		}
		api.setOption = function (key, value) {
			options[key] = value;
		}
		api.getOption = function (key) {
			return options[key];
		}

	function createJustifyFixDiv() {
		justifyFixDiv = document.createElement("div");
		justifyFixDiv.classList.add( classes.JUSTIFY_FIX );
		justifyFixDiv.style.display = "inline-block";
		justifyFixDiv.style.width = "100%";
		containerItems.appendChild( justifyFixDiv );
	}

	function initialize() {

		options = opts || options;

		if ( !(element instanceof Element) ) {

			return;
		}

		var items = getItems(true);
		if ( !items.length ) return;


		containerItems = items[0].parentNode;
		if ( containerItems ) {

			containerItems.style.textAlign = "justify";
			createJustifyFixDiv();
		} else {
			return;
		}

		if ( !getItemsHaveSameWidth() ) {

			console.error("items need to have same width");
			return;
		}
		whitespace = getNeedsWhiteSpace();



		if ( typeof options.sameHeight != "boolean" ) {

			options.sameHeight = containerItems.classList.contains("masonry--items--sameheight");
		}

		if ( Array.isArray(options.plugins) ) {
			Static.each(options.plugins, function (plugin) {
				plugin( api );
			});
		}

		initializeFilter( items );

		if ( !whitespace) {
			justifyFix();
		}
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
		});

		element.classList.add(classes.INITIALIZED);

		Promise.all(
			items.map(function (item) {
				return transition(item, styles.visible, 300);
			})
		);

		addGlobalListeners();
	}

	function addGlobalListeners() {
		window.addEventListener("resize", onWindowResize);
	}

	function removeGlobalListeners() {
		window.removeEventListener("resize", onWindowResize);
		Static.each(categories, function (el) {
			Static.dom.detachListener(el, "click", onCategoryClick);
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

				var filterContainer = options.filterContainer || document.createElement("div");
					filterContainer.className = classes.FILTER;

				categories.push( labels.ALL );
				categories = categories.sort().reverse();

				for (var i = 0, hammer; i < categories.length; i++) {
					category = document.createElement("div");
					category.classList.add(classes.CATEGORY);
					category.textContent = categories[i];
					category.setAttribute("data-category", categories[i]);
					Static.dom.attachListener(category, "click", onCategoryClick);
					filterContainer.appendChild(category);
				}
				categories = Array.prototype.slice.call(filterContainer.children);

				setActiveCategory(labels.ALL);

				if ( !options.filterContainer ) {
					element.insertBefore(filterContainer, element.childNodes[0])
				}
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
		justifyFix();

		return columns;
	}

	function justifyFix() {

		var items = getItems();

		if ( items.length % columns != 0 ) {
			removePlaceholders(2);

			for (var i = 0; i < columns - (items.length % columns); i++) {
				addPlaceHolder(items);
			}
		}

		var l = containerItems.childNodes.length;
		for (var i = 0, node; i < l; i++) {

			node = containerItems.childNodes[i];
			if ( ! node ) {
				continue;
			}

			if ( node.nodeType === 3 ) {

				if ( !whitespace ) {

					// remove text node
					node.parentNode.removeChild( node );
					i--;
					continue;
				}
				node.textContent = " ";

				if ( node.nextSibling && node.nextSibling.nodeType === 3 ) {
					// avoid 2 adjacent text nodes
					node.nextSibling.parentNode.removeChild( node.nextSibling );
					i--;
				}
			}

			if ( node.nodetype === 1 && items.indexOf(node) != -1 ) {

				if ( whitespace && node.nextSibling && node.nextSibling.nodeType === 1 ) {

					// add missing text node
					node.parentNode.insertBefore(document.createTextNode(" "), node.nextSibling);
				}
			}
		}
	}

	function addPlaceHolder(items) {

		items = items || getItems();

		var el = document.createElement("DIV");
			el.className = items.length ? items[0].className : classes.ITEM;
			el.classList.add(classes.ITEM_PLACEHOLDER);
			el.style.visibility = "hidden";

		if ( whitespace && containerItems.lastChild.nodeType != 3 ) {
			containerItems.appendChild(document.createTextNode(" "));
		}
		containerItems.appendChild(el);
	}

	// visual optimization: swaps placeholder and item of shortest column if that would even out the column heights
	function flowFix() {

		var itemsLastRow = [];
		var items = getItems( true );

		if ( justifyFixDiv.parentNode ) {
			containerItems.removeChild(justifyFixDiv); // this messes up this method, so I remove it for now...
		}

		for (var i = 0, child; i < items.length; i++) {

			child = items[i];
			if ( i >= items.length - columns) {
				// console.log('test', child);
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

				if ( child.offset < item.offset ) {

					DomUtils.swapChildren(child.element, item.element);

					layout();
					flowFix();
					break;
				}
			}
		}

		createJustifyFixDiv();
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

	function removePlaceholders(a) {

		Static.each(containerItems.querySelectorAll("." + classes.ITEM_PLACEHOLDER), function (placeholder) {
			placeholder.parentNode.removeChild(placeholder);
		});
	}

	function layout(reset) {

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

		Static.each(items, function (item, i) {

			if ( columns === 1 || i < columns || reset) {
				item.style.marginTop = "";
			}

			if ( i < columns ) return;

			var itemAbove = items[i - columns];
			var curr = parseInt(item.style.marginTop) || 0;
			var dif = Math.floor(item.offsetTop - itemAbove.offsetTop - itemAbove.offsetHeight - parseInt(getComputedStyle(itemAbove).getPropertyValue("margin-bottom")));

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
			item.style.display = "none";
			return false;
		}
		item.classList.remove(classes.ITEM_HIDDEN);
		item.style.display = "";

		return true;

	}

	// if item colums dont add up to 100% (2px tolerance because render engines), we probably need white space
	function getNeedsWhiteSpace(){
		var needsWhiteSpace = false;
		var items = getItems(true);
		if ( !items.length || !containerItems ) return;

		var itemWidth = items[0].offsetWidth;
		var containerWidth = containerItems.offsetWidth;

		var modWidth = containerWidth%itemWidth;
		if ( modWidth > 2 && modWidth < itemWidth - 2 ) {

			needsWhiteSpace = true;
		}
		return needsWhiteSpace;
	}

	function getItemsHaveSameWidth() {
		var itemsHaveSameWidth = true;
		Static.each(getItems(true), function (item, i, items) {
			var nextItem = items[i+1];
			if ( nextItem ) {
				if ( Math.abs(item.offsetWidth - nextItem.offsetWidth) > 1 ) {
					itemsHaveSameWidth = false;
				}
			}
		});
		return itemsHaveSameWidth;
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
module.exports = window.Masonry = Masonry;


