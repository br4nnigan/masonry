this is a light weight replacement for the popular Masonry javascript plugin. It's only supposed to handle items of same width, so it adjust each rows height OR shifts each columns items vertically, so all items have a common vertical margin.

### Usage


#### constructor

`var masonry = new Masonry( element, options )`

accepts a root Element and and an options object.


#### options

*staticLayout : Boolean*

If you want to use a static css layout (probably using `text-align: justify`). The Masonry takes care of placeholders and white space to make it work.

*sameHeight : Boolean*

Items of one row are set to have the same height (min-height actually), instead of being aligned vertically.

*onBeforeCategoryChange : Void -> Void*

Function called before a category changes



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

#### events

onBeforeCategoryChange