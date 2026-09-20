import type { ButtonProps } from "@/components/common/Button";

const BUTTON_CLASSES: Record<ButtonProps["style"], string> = {
    default:
        "w-full rounded-md bg-previna px-4 py-2 font-bold text-white shadow-sm transition-all duration-200 cursor-pointer hover:bg-previna-light hover:shadow-md active:shadow-sm focus:ring-previna focus:outline-none focus:ring-2 focus:ring-offset-2 sm:w-50",
};

export default BUTTON_CLASSES;
