import React from 'react';
import UserBadgeItem from './UserBadgeItem';
import { User } from '../../types/interfaces';

function UserBadgeList({ users, handleFunction, isCreate }: any) {
  return users.map((user: User) => (
    <UserBadgeItem
      userInfo={user}
      key={user.id}
      handleFunction={handleFunction}
      isCreate={isCreate}
    />
  ));
}

export default UserBadgeList;
