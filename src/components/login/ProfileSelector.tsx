import { User, UserCheck } from 'lucide-react';

interface ProfileSelectorProps {
    onSelect: (profile: 'el' | 'ella', e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function ProfileSelector({ onSelect }: ProfileSelectorProps) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {/* Button: Él */}
            <button
                onClick={(e) => onSelect('el', e)}
                className="group relative flex flex-col items-center justify-center border border-white/12 bg-white/[0.04] backdrop-blur-md py-8 px-4 transition-all duration-200 hover:border-[#c3f400] hover:bg-[#c3f400]/10 hover:translate-y-[-2px] active:translate-y-[0px]"
            >
                <div className="mb-3 flex h-12 w-12 items-center justify-center border border-white/15 bg-white/[0.04] text-white/60 transition-colors duration-200 group-hover:border-[#c3f400] group-hover:text-[#c3f400]">
                    <User className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 group-hover:text-[#c3f400]">
                    ÉL
                </span>
                {/* Tech corner accent inside button */}
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-white/15 group-hover:bg-[#c3f400] transition-colors" />
            </button>

            {/* Button: Ella */}
            <button
                onClick={(e) => onSelect('ella', e)}
                className="group relative flex flex-col items-center justify-center border border-white/12 bg-white/[0.04] backdrop-blur-md py-8 px-4 transition-all duration-200 hover:border-[#ff4b89] hover:bg-[#ff4b89]/10 hover:translate-y-[-2px] active:translate-y-[0px]"
            >
                <div className="mb-3 flex h-12 w-12 items-center justify-center border border-white/15 bg-white/[0.04] text-white/60 transition-colors duration-200 group-hover:border-[#ff4b89] group-hover:text-[#ff4b89]">
                    <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 group-hover:text-[#ff4b89]">
                    ELLA
                </span>
                {/* Tech corner accent inside button */}
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-white/15 group-hover:bg-[#ff4b89] transition-colors" />
            </button>
        </div>
    );
}
