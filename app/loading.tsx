export default function Loading() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background">
            <div className="flex w-full max-w-xs flex-col items-center px-6">
                <div className="animate-logo-in">
                    <img
                        src="/brand/logos/letter-no-bg.png"
                        alt="صنايعي.كوم"
                        width={220}
                        height={70}
                        className="h-auto w-[180px] object-contain sm:w-[210px] dark:hidden"
                    />

                    <img
                        src="/brand/logos/letter-no-bg-darkmode.png"
                        alt="صنايعي.كوم"
                        width={220}
                        height={70}
                        className="hidden h-auto w-[180px] object-contain sm:w-[210px] dark:block"
                    />
                </div>

                <div className="mt-8 h-1 w-32 overflow-hidden rounded-full bg-muted">
                    <div className="animate-loading-bar h-full w-1/2 rounded-full bg-primary" />
                </div>
            </div>
        </main>
    );
}