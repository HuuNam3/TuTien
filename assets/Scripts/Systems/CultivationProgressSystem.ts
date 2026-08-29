export type CultivationProgress = {
    current: number;
    required: number;
};

export type CultivationRequirementConfig = {
    realmId: number;
    majorRealm: string;
    minorBaseRequirement: number;
    minorStepRequirement: number;
    majorBreakthroughRequirement: number | null;
};

export class CultivationProgressSystem {
    public static createProgress(required: number, currentRatio = 0): CultivationProgress {
        return {
            current: Math.floor(required * Math.max(0, Math.min(1, currentRatio))),
            required,
        };
    }

    public static addCultivation(progress: CultivationProgress, amount: number): CultivationProgress {
        return {
            current: Math.min(progress.required, progress.current + Math.max(0, amount)),
            required: progress.required,
        };
    }

    public static canBreakthrough(progress: CultivationProgress): boolean {
        return progress.current >= progress.required;
    }

    public static getMinorRequirement(config: CultivationRequirementConfig, toMinorIndex: number): number {
        const safeIndex = Math.max(2, Math.floor(toMinorIndex));
        return config.minorBaseRequirement + config.minorStepRequirement * (safeIndex - 2);
    }

    public static getMajorRequirement(config: CultivationRequirementConfig): number | null {
        return config.majorBreakthroughRequirement;
    }
}
