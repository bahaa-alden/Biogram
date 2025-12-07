import React from 'react';
import { User } from '../../types/interfaces';
import UserItem from './UserItem';

interface UserListItemProps {
  users: User[];
  handleFunction: (user: User) => void;
  loadingChat: boolean;
  isClicked: number | undefined;
  setIsClicked: (index: number) => void;
}

function UserListItem({
  users,
  handleFunction,
  loadingChat,
  isClicked,
  setIsClicked,
}: UserListItemProps) {
  return (
    <>
      {users.map((user: User, index: number) => (
        <UserItem
          key={user.id || user._id || index}
          user={user}
          handleFunction={handleFunction}
          loadingChat={loadingChat}
          isClicked={isClicked}
          setIsClicked={setIsClicked}
          index={index}
        />
      ))}
    </>
  );
}

export default UserListItem;
