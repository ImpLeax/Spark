import React from "react";
import { Avatar, AvatarImage, AvatarFallback, AvatarBadge } from "@/components/ui/avatar"

function SidebarProfile({ name, avatar, gender, lookingFor }) {
  return (
    <div className="h-25 px-1 bg-linear-to-r dark:to-primary dark:from-chart-1 from-pink-300 to-white shadow rounded-b-lg overflow-hidden">
      <div className="flex flex-row py-1">
        <Avatar size="lg" className="border shadow-sm">
          <AvatarImage src={avatar} />
          <AvatarFallback className="bg-red-100 text-red-700 uppercase">
            {name ? name.slice(0, 2) : "NA"}
          </AvatarFallback>
          <AvatarBadge className="bg-green-500 ring-2 ring-white size-3" />
        </Avatar>
        <div className="font-medium text-2xl px-2 py-1 text-black">{name}</div>
      </div>
      <div className="px-2 text-black">
        <div>Gender: {gender}</div>
        <div>Looking for: {lookingFor}</div>
      </div>
    </div>
  );
}

export default SidebarProfile;