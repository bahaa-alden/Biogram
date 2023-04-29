import { User } from '../types/interfaces';

export const getSender = (loggedUser: User, users: User[]) =>
  loggedUser.id === users[0].id ? users[1].name : users[0].name;
export const getSenderFull = (loggedUser: User, users: User[]) =>
  loggedUser.id === users[0].id ? users[1] : users[0];

export const isSameSender = (messages: any, m: any, i: any, userId: any) => {
  return (
    i < messages.length - 1 &&
    (messages[i + 1].sender.id !== m.sender.id ||
      messages[i + 1].sender.id === undefined) &&
    messages[i].sender.id !== userId
  );
};
export const isLastMessage = (messages: any, i: any, userId: any) => {
  return (
    i === messages.length - 1 &&
    messages[messages.length - 1].sender.id !== userId
  );
};
export const showSenderName = (messages: any, m: any, i: any, userId: any) => {
  return (
    (!messages[i - 1] || messages[i - 1].sender.id !== m.sender.id) &&
    m.sender.id !== userId
  );
};

export const isSameSenderMargin = (
  messages: any,
  m: any,
  i: any,
  userId: any,
  isGroup: any
) => {
  if (
    i < messages.length - 1 &&
    messages[i + 1].sender.id === m.sender.id &&
    messages[i].sender.id !== userId &&
    isGroup
  )
    return 37;
  else if (
    (i < messages.length - 1 &&
      messages[i + 1].sender.id !== m.sender.id &&
      messages[i].sender.id !== userId) ||
    (i === messages.length - 1 && messages[i].sender.id !== userId) ||
    !isGroup
  ) {
    return 0;
  } else return 0;
};

export const isSameUser = (messages: any, m: any, i: any) =>
  i > 0 && messages[i - 1].sender.id === m.sender.id;

export const getMessageTime = (myTime: Date) => {
  let hour = myTime.getHours();
  let minute: number | string = myTime.getMinutes();
  let amPm = hour >= 12 ? 'pm' : 'am';
  hour = hour % 12;
  hour = hour ? hour : 12; // the hour '0' should be '12'
  minute = minute < 10 ? '0' + minute : minute;
  let timeInAmPm = hour + ':' + minute + ' ' + amPm;
  return timeInAmPm;
};
