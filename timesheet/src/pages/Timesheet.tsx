import * as React from "react"
import { useContext, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"


import { UserContext } from "@/provider/UserProvider";

const invoices = [
  {
    proj_name: "ERP Implementation",
    time: "2:00",
  },
  {
    proj_name: "ERP Implementation",
    time: "2:00",
  },
  {
    proj_name: "ERP Implementation",
    time: "2:00",
  },
]

const weekList = [
  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
]

const displayWeekList = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
]

function Timesheet() {
  const [date, setDate] = React.useState<Date>(new Date())
  const { currentUser, isLoading } = useContext(UserContext);
  const weekRef = useRef<Array<HTMLButtonElement | null>>([]);

  const selectDefaultWeek = () => {
    const newDate = new Date(date);
    const dayOfWeek = newDate.getDay();
    const selector = 'radix-:r8:-trigger-' + weekList[dayOfWeek];
    const button = weekRef.current.find((ref) => ref?.id === selector);
    if (button) {
      button.focus();
    }

  }

  selectDefaultWeek();

  const handleDecrease = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 1);
    setDate(newDate);
    const dayOfWeek = newDate.getDay();
    const button = weekRef.current.find((ref) => ref?.id.includes(weekList[dayOfWeek]) );
    if (button) {
      button.focus();
    }

  };

  const handleIncrease = () => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 1);
    setDate(newDate);

    const dayOfWeek = newDate.getDay();
    const selector = 'radix-:r8:-trigger-' + weekList[dayOfWeek];
    const button = weekRef.current.find((ref) => ref?.id.includes(weekList[dayOfWeek]) );
    if (button) {
      button.focus();
    }
  };

  return (
    <div className="mt-10 border-l border-t border-r border-gray-300 rounded-tl-lg rounded-tr-lg p-2 min-w-[1300px]">
      <div className="fixed top-0 pt-2 border-l border-b border-r border-gray-300 rounded-bl-lg rounded-br-lg min-w-[1280px]">
      <NavigationMenu>
      <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>{currentUser}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[200px] text-black text-left">
                  <ListItem
                    key="Switch to desk"
                    title="Switch to desk"
                    href="/desk"
                  >
                  </ListItem>
                  <ListItem
                    key="Logout"
                    title="Logout"
                    href="/?cmd=web_logout"
                  >
                  </ListItem>
            </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      </div>
      <div className="flex min-w-[1280px] justify-start">
      <Button onClick={handleDecrease} variant={"outline"}><ChevronLeft /></Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[150px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button onClick={handleIncrease}variant={"outline"}><ChevronRight /></Button>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button className="ml-auto" variant="outline">New Time Entry</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Time Entry for {date ? format(date, "PPP") : <span>Pick a date</span>}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                defaultValue="Pedro Duarte"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username
              </Label>
              <Input
                id="username"
                defaultValue="@peduarte"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>

      <Tabs defaultValue="Mon" className="w-[1280px]">
        <TabsList className="flex justify-start items-center mb-2">
          {displayWeekList.map((weekList, index) => (
            <TabsTrigger ref={(el) => (weekRef.current[index] = el)} className="flex-col" value={weekList}>{weekList}</TabsTrigger>
          ))}
        </TabsList>
        {weekList.map((weekList) => (
            <TabsContent value={weekList}>
              <Table>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.proj_name}>
                      <TableCell className="font-medium text-left">{invoice.proj_name}</TableCell>
                      <TableCell>{invoice.time}</TableCell>
                      <TableCell className="text-right"><Button variant="outline">Edit</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          ))}
    </Tabs>
    </div>
  );
}

export default Timesheet;


const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none hover:bg-accent hover:text-accent-foreground text-black focus:bg-accent",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"