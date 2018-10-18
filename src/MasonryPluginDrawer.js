var Masonry = require("./Masonry");
var Static = require("Static.js");
var Hammer = require("hammerjs");
var DomUtils = Static.dom;
var transition = require("css-transition");

function MasonryPluginDrawer( masonry ) {

	var columns = -1;
	var container = null;
	var drawer = null;
	var currentItem = null;

	var classes = {
		DRAWER: "masonry--item__drawer",
		ITEM: "masonry--item",
		ITEM_HIDDEN: "masonry--item--hidden",
		ITEM_CURRENT: "masonry--item--current"
	}
	var api = {
		close: function () {
			closeDrawer( openDrawer );
		}
	}

	function initialize() {

		if ( !(Object.getPrototypeOf(masonry) == Masonry) ) {
			return;
		}

		if ( masonry.getOption("sameHeight") !== true ) {
			console.warn("MasonryPluginDrawer works only with the sameHeight option set");
			return;
		}

		var items = masonry.getItems(false, true);
		columns = masonry.getColumns();

		if ( !items.length ) {
			return;
		}

		container = items[0].parentNode;

		Static.each(items, function (item) {
			var drawer = item.querySelector("." + classes.DRAWER);
			if ( drawer ) {
				Hammer(item).on("tap", onItemRequest);
			}
		});

		masonry.setOption("onBeforeCategoryChange", onBeforeCategoryChange);
		window.addEventListener("resize", onWindowResize);
	}

	function createDrawer( sourceDrawer, item ) {

		var itemsWithPlaceholders = masonry.getItems(true, true);
		var itemsNoPlaceholders = masonry.getItems(false, true);
		var placeholders = itemsWithPlaceholders.length - itemsNoPlaceholders.length;
	 	var cssClassWidth = "w" + (columns - placeholders) + "of" + columns;

	 	var itemIndex = itemsNoPlaceholders.indexOf(item);

	 	var itemIndexReverse = itemIndex - itemsWithPlaceholders.length + 1;

	 	if ( columns + itemIndexReverse <= 0 ) {
	 		cssClassWidth = "w" + columns + "of" + columns;
	 	}

		var element = document.createElement("DIV");
			element.classList.add(classes.DRAWER);
			element.classList.add(cssClassWidth);
			element.innerHTML = sourceDrawer.innerHTML;

		return element;
	}

	function openDrawer( item, callback ) {

		var sourceDrawer = item.querySelector("." + classes.DRAWER);
		var indexDrawer = getDrawerIndexForItem(item);

		var d = createDrawer( sourceDrawer, item );
			d.style.position = "absolute";
			d.style.visibility = "hidden";
			d.style.zIndex = 1;

		// place hidden drawer in dom so we can measure its offset height
		var ref = container.children[indexDrawer];
		if ( ref ) {
			container.insertBefore(d, ref);
		} else {
			container.appendChild(d);
		}

		drawer = d;
		currentItem = item;

		currentItem.classList.add(classes.ITEM_CURRENT);

		if ( callback ) {
			var height = d.offsetHeight;

			// set initial position for transition
			d.style.marginTop = (height * -1) + "px";
			d.style.visibility = "";
			d.style.position = "";

			// do transition
			transition(d, {
				marginTop: 0
			}, 300, function () {
				if ( typeof callback == "function" ) {
					callback.call();
				}
			});
		} else {
			// reset css to show new drawer
			d.style.position = "";
			d.style.visibility = "";
		}
	}

	// get where the drawer should be in dom, considering item position, columns and hidden items
	function getDrawerIndexForItem(item) {

		columns = masonry.getColumns();

		var items = masonry.getItems();
		var indexItem = Array.prototype.indexOf.call(items, item);
		var indexDrawer = indexItem + columns - (indexItem%columns);
		var diff = indexDrawer - indexItem;

		items = masonry.getItems(false, true);
		indexItem = Array.prototype.indexOf.call(items, item); // get position including hidden items
		indexDrawer = indexItem + diff; // where the drawer should be if there were no hidden items after item

		// if hidden items between item position and drawer position count up drawer
		// position until we skipped actual visible items of number diff
		Static.each(items, function (item, i) {
			if ( i > indexItem ) {
				if ( item.classList.contains(classes.ITEM_HIDDEN) && diff > 0  ) {
					indexDrawer++;
				} else {
					diff--;
				}
			}
		});

		// if old drawer is between before new drawer position, count up drawer position
		if ( drawer && drawer.parentNode ) {
			var indexCurrentDrawer = Array.prototype.indexOf.call(drawer.parentNode.children, drawer);
			if ( indexCurrentDrawer < indexDrawer ) {
				indexDrawer++;
			}
		}
		return indexDrawer;
	}

	function closeDrawer( callback ) {

		if ( !drawer || !drawer.parentNode ) {
			return;
		}

		var d = drawer;

		currentItem.classList.remove(classes.ITEM_CURRENT);

		if ( callback ) {
			var height = d.offsetHeight;
			d.style.zIndex = 0;

			transition(d, {
				marginTop: (height * -1) + "px"
			}, 300, function () {
				d.parentNode.removeChild(d);
				// if drawer has not been replace with new drawer unset variable
				if ( d == drawer ) drawer = null;

				if ( typeof callback == "function" ) {
					callback.call();
				}
			});

		} else {

			d.parentNode.removeChild(d);
			// if drawer has not been replace with new drawer unset variable
			if ( d == drawer ) drawer = null;
		}
	}

	function onBeforeCategoryChange() {

		closeDrawer();
	}

	function onItemRequest( event ) {

		var item = DomUtils.closest(event.target, "." + classes.ITEM);

		// console.log("onItemRequest", item, drawer);

		if ( !item ) {
			return;
		}

		if ( drawer ) {

			if ( item == currentItem ) {
				closeDrawer( true );
			} else if ( currentItem.offsetTop == item.offsetTop ) {
				closeDrawer( function () {
					openDrawer( item, true );
				});
			} else {
				closeDrawer( true );
				openDrawer( item, true );
			}

		} else {
			openDrawer( item, true );
		}

	}

	function onWindowResize() {

		closeDrawer();
	}

	return initialize(), api;
}
module.exports = window.MasonryPluginDrawer = MasonryPluginDrawer;


