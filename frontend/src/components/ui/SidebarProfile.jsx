import React from "react";
import { Avatar, AvatarImage, AvatarFallback,AvatarBadge} from "@/components/ui/avatar"
import { ArrowLeftToLineIcon } from "lucide-react";
function SidebarProfile(params){
    return(
        <div className="h-25 px-1 bg-linear-to-r to-primary from-chart-1 shadow rounded-b-lg overflow-hidden">
            <div className=" flex flex-row py-1">
            <Avatar size="lg" className="border shadow-sm">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback className="bg-red-100 text-red-700">NA</AvatarFallback>
                <AvatarBadge className="bg-green-500 ring-2 ring-white size-3" />
            </Avatar>
            <div className="font-medium text-2xl px-2 py-1 text-black">Nickname</div>
            </div>
            <div className="px-2 text-black">
                <div>Last online:</div>
                <div>Shares N interests with you</div>
            </div>
        </div>
    );
}
export default SidebarProfile;
