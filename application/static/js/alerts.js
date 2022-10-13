/*
    SweetAlert2 js alerts.

    Reference(s):
    -- https://sweetalert2.github.io/
*/

function ShowAlert(message, type, time) {
    let width, position, showConfirmButton;

    if (window.innerWidth > 810) {
        width = '25%';
        position = 'bottom-start';
        showConfirmButton = true;
    } else {
        width = '80%';
        position = 'bottom';
        showConfirmButton = false;
    }

    Swal.fire({
        icon: type,
        title: message,
        timer: time,
        width: width,
        toast: true,
        confirmButtonText: 'Ok',
        position: position,
        showConfirmButton: showConfirmButton,
        stopKeydownPropagation: false,
        customClass: {
            confirmButton: 'sw-confirmButton',
            title: 'sw-title'
        },
        buttonsStyling: false
    });
}