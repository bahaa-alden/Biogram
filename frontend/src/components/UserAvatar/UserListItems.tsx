import React from 'react';
import { User } from '../../types/interfaces';
import UserItem from './UserItem';

function UserListItem({ users, handleFunction }: any) {
  return users.map((user: User) => (
    <UserItem key={user.id} user={user} handleFunction={handleFunction} />
  ));
}

export default UserListItem;
