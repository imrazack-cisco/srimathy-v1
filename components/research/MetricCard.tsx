interface MetricCardProps {

    title: string;

    value: string | number;

    subtitle?: string;

}

export default function MetricCard({

    title,

    value,

    subtitle

}: MetricCardProps) {

    return (

        <div className="rounded-xl border border-cyan-900 bg-slate-900 p-5">

            <div className="text-sm text-slate-400">

                {title}

            </div>

            <div className="mt-2 text-3xl font-bold text-cyan-300">

                {value}

            </div>

            {subtitle && (

                <div className="mt-2 text-xs text-slate-500">

                    {subtitle}

                </div>

            )}

        </div>

    );

}