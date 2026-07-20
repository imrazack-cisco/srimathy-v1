"use client";

import { useEffect, useState } from "react";

import {
  Brain,
  Cpu,
  Server,
  Wifi,
  WifiOff,
  Activity,
} from "lucide-react";

type RuntimeResponse = {
  online: boolean;
  model: string;
  installedModels: number;
  promptCount: number;
  averageResponseTime: number;
  lastResponseTime: number;
  uptime: number;
  apiCost: string;
};


export default function RuntimeCard() {

  const [runtime, setRuntime] = useState<RuntimeResponse | null>(null);

  useEffect(() => {

    load();

    const timer = setInterval(load, 5000);

    return () => clearInterval(timer);

  }, []);

  async function load() {

    const res = await fetch("/api/runtime");

    const json = await res.json();

    setRuntime(json);

  }

  const model =
    runtime?.model ?? "No model";

  return (

    <div className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-6 shadow-xl">

      <div className="flex items-center justify-between">

        <div className="flex items-center gap-3">

          <Brain
            className="text-cyan-400"
            size={30}
          />

          <div>

            <h2 className="text-2xl font-bold">

              AI Runtime

            </h2>

            <p className="text-slate-400 text-sm">

              Live Runtime Monitor

            </p>

          </div>

        </div>

        {runtime?.online ? (

          <div className="flex items-center gap-2 text-green-400">

            <Wifi size={18}/>

            Online

          </div>

        ) : (

          <div className="flex items-center gap-2 text-red-400">

            <WifiOff size={18}/>

            Offline

          </div>

        )}

      </div>

      <div className="mt-8 space-y-4">

        <Row
          icon={<Brain size={18}/>}
          title="Current Model"
          value={model}
        />

        <Row
          icon={<Cpu size={18}/>}
          title="Inference"
          value="Ollama Local"
        />

        <Row
          icon={<Server size={18}/>}
          title="Runtime"
          value={runtime?.online ? "Healthy" : "Unavailable"}
        />

        <Row
          icon={<Activity size={18}/>}
          title="Models Installed"
          value={`${runtime?.installedModels ?? 0}`}        />

      </div>

    </div>

  );

}

function Row({

  icon,
  title,
  value,

}:{

  icon:React.ReactNode;
  title:string;
  value:string;

}){

  return(

    <div className="flex items-center justify-between rounded-xl bg-slate-800 p-3">

      <div className="flex items-center gap-3">

        <div className="text-cyan-400">

          {icon}

        </div>

        <span>

          {title}

        </span>

      </div>

      <span className="font-semibold text-cyan-300">

        {value}

      </span>

    </div>

  );

}