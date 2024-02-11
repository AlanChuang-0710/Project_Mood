import { notifications } from '@mantine/notifications';

/**
 * 
 * @param {*} title String 
 * @param {*} message String
 * @param {*} withCloseButton Boolean   
 * @param {*} onClose Function callback when close 
 * @param {*} onOpen Function callback when open 
 * @param {*} autoClose Number default 3000
 * @param {*} color String 
 */
export const warnNotify = ({ title = "Thoughtful Notification", message = "Default message", withCloseButton = true, onClose = () => { }, onOpen = () => { }, autoClose = 3000 } = {}) => {
    notifications.show({
        title,
        message,
        color: "orange",
        withCloseButton,
        onClose,
        onOpen,
        autoClose
    });
};

export const kindNotify = ({ title = "Default title", message = "Default message", withCloseButton = true, onClose = () => { }, onOpen = () => { }, autoClose = 3000 }) => {
    notifications.show({
        title,
        message,
        color: "green",
        withCloseButton,
        onClose,
        onOpen,
        autoClose
    });
};