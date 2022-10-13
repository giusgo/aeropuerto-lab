/*
    Motion of the plane.
    
    Reference(s):
    -- Motion on leaflet.js: https://github.com/Igor-Vladyka/leaflet.motion
*/



/*
    MAIN FUNCTION
*/
function MoveAirplane(path, time) {

    var anim = L.motion.polyline(path, {
            color: "transparent"
            }, {
                easing: L.Motion.Ease.easeInOutQuad
            }, {
                removeOnEnd: true,
                showMarker: true,
                icon: L.divIcon({html: `<i class='fa fa-plane fa-2x' aria-hidden='true' motion-base='-48'></i>`, iconSize: L.point(0,0)})
            }).motionDuration(time).addTo(map);
    
    anim.motionStart();

    setInterval(function() {
        anim.remove(map);
    }, time);
}
////


