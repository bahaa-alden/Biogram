import React from 'react';
import { User } from '../../types/interfaces';
import UserItem from './UserItem';

function UserListItem({
  users,
  handleFunction,
  loadingChat,
  isClicked,
  setIsClicked,
}: any) {
  return users.map((user: User, index: number) => (
    <UserItem
      key={user.id}
      user={user}
      handleFunction={handleFunction}
      loadingChat={loadingChat}
      isClicked={isClicked}
      setIsClicked={setIsClicked}
      index={index}
    />
  ));
}

export default UserListItem;
