import { Composition } from "remotion";
import { MidjourneyPromo } from "./projects/midjourney-promo/MidjourneyPromo";
import { NeuralSeek } from "./projects/neural-seek/NeuralSeek";
import { StillHere } from "./projects/still-here/StillHere";
import { CosmicForge } from "./projects/cosmic-forge/CosmicForge";
import { CyberAscent } from "./projects/cyber-ascent/CyberAscent";
import { WalkCycle } from "./projects/walk-cycle/WalkCycle";
import { IsometricCity } from "./projects/isometric-city/IsometricCity";
import { ThreeDemo } from "./projects/three-demo/ThreeDemo";
import { ArchViz } from "./projects/zis-showcase/ArchViz";
import { ZISShowcase } from "./projects/zis-showcase/ZISShowcase";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="MidjourneyPromo"
      component={MidjourneyPromo}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="NeuralSeek"
      component={NeuralSeek}
      durationInFrames={1260}
      fps={30}
      width={1080}
      height={1080}
    />
    <Composition
      id="StillHere"
      component={StillHere}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="CosmicForge"
      component={CosmicForge}
      durationInFrames={1200}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="CyberAscent"
      component={CyberAscent}
      durationInFrames={1800}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="WalkCycle"
      component={WalkCycle}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="ArchViz"
      component={ArchViz}
      durationInFrames={1800}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="ThreeDemo"
      component={ThreeDemo}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="ZISShowcase"
      component={ZISShowcase}
      durationInFrames={2760}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="IsometricCity"
      component={IsometricCity}
      durationInFrames={1200}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
