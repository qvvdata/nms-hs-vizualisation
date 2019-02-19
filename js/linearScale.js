// based on http://processing.org/reference/javadoc/core/processing/core/PApplet.html#map(float, float, float, float, float)
var linearScale = function(domain, range) {

    var istart = domain[0];
    var istop  = domain[1];
    var ostart = range[0];
    var  ostop  = range[1];

    return function scale(value) {
        return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
    }
};
