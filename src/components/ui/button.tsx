import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // base
  "inline-flex items-center justify-center whitespace-nowrap shrink-0 gap-2 outline-none rounded-md font-['Kumbh_Sans',sans-serif] font-bold transition-all disabled:opacity-50 disabled:pointer-events-none focus-visible:ring-4 focus-visible:ring-primary/25 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Your normal primary (keep your design system working)
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",

        // Category chip (clean, no outline)
        chip:
          "bg-gray-100 text-gray-700 capitalize border-0 rounded-md hover:bg-gray-200",

        // Main nav CTA (orange)
        nav:
          "bg-[var(--orange)] text-black border border-[#1d2130] rounded-md shadow-[3px_3px_0_1px_#f6b15059] hover:bg-[var(--orange-hover)]",

        outline:
          "border bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // padding: .5rem 2rem
        chip: "py-2 px-8 text-base",
        // padding: 1rem 2.5rem
        nav: "py-4 px-10 text-base",
        default: "h-10 px-4 text-sm",
        sm: "h-8 px-3 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "size-10",
      },
      active: {
        true: "" // used only with chip via compound below
      }
    },
    compoundVariants: [
      {
        variant: "chip",
        active: true,
        class:
          // selected chip: solid blue fill with white text
          "bg-[var(--beam)] text-white border-[var(--beam)] hover:bg-[var(--beam)]/90"
      }
    ],
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Button({
  className,
  variant,
  size,
  active,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, active }), className)}
      {...props}
    />
  )
}

export { buttonVariants }
