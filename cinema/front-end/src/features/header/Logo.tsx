import Link from "next/link";

export default function Logo() {
    return (
        <Link href={"/"}>
            <div className="flex select-none items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path
                        d="M3 15L8 9L12.5 13L19 5"
                        stroke="#24493B"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <circle cx="19" cy="5" r="2.2" fill="#24493B" />
                </svg>

                <h1 className="text-[19px] font-medium tracking-tight text-[#171A18]">
                    ASTRA
                </h1>
            </div>
        </Link>
    )
}