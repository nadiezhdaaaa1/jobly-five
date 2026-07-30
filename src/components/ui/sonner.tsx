import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-center"
      className="toaster group"
      toastOptions={{
        style: { width: "auto" },
        classNames: {
          toast:
            "group toast !w-auto mx-auto group-[.toaster]:bg-foreground group-[.toaster]:text-background group-[.toaster]:border-transparent group-[.toaster]:shadow-lg group-[.toaster]:rounded-[4px] group-[.toaster]:px-3 group-[.toaster]:py-2 group-[.toaster]:text-[13px] group-[.toaster]:font-medium group-[.toaster]:min-h-0",
          title: "group-[.toast]:text-[13px] group-[.toast]:font-medium",
          description: "group-[.toast]:text-background/70 group-[.toast]:text-[12px]",
          actionButton: "group-[.toast]:bg-background group-[.toast]:text-foreground",
          cancelButton: "group-[.toast]:bg-background/20 group-[.toast]:text-background",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
