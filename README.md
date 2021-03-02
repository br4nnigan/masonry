this is a light weight replacement for the popular Masonry javascript plugin. It's only supposed to handle items of same width, so it adjusts each rows height OR shifts each columns items vertically, so all items have a common vertical margin. Also features a filter based on custom categories.

### Usage


#### constructor

`var masonry = new Masonry( element, options )`

accepts a root element and and an options object. Masonry items are queried within the root element using the selector `.masonry--item`. They must have the attributes `display: inline-block` and `vertical-align: top` and should have a `width` set in `%`


#### options

*filterContainer : Element*

If you want to work with categories you can specify a container element here. Otherwise it will be added to the root element.

*sameHeight : Boolean*

Items of one row are set to have the same height (min-height actually), instead of being aligned vertically.

*onBeforeCategoryChange : Void -> Void*

Function called before a category changes

*plugins : Array*

Array of plugins to use (see below).

#### Plugins

*MasonryPluginDrawer*

On click of an item toggles a drawer below in a new row. The drawer dom element must exist within the item element and have the class `masonry--item__drawer` and should be `display: none`. This currently only works when the sameHeight option is used.

#### Filter categories

Items may have the dom attribute `data-category` set and masonry will create a list of filter buttons.

##### API

`masonry.getItems( includePlaceholders, includeHidden )`

returns the masonry items.

*includePlaceholders : Boolean*

placeholders are used in static layouts to make the last line work in justify layouts

*includeHidden : Boolean*

includes items currently hidden by filter (if filter categories are used)

`masonry.destroy()`

removes all event listeners

`masonry.getColumns()`

returns the number of columns of the masonry

`masonry.setOption( key, value )`

setting an option on the instance. Not sure currently why one would do this.

`masonry.getOption( key )`

getting an option on the instance.

#### events

onBeforeCategoryChange
