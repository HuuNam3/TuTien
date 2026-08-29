export type CultivationPointRewardConfig = {
    realmId: number;
    majorRealm: string;
    basePoint: number;
    minorStepBonus: number;
    majorBreakthroughBonus: number;
};

export type CultivationStage = {
    realmId: number;
    minorIndex: number;
};

export type CultivationBreakthroughReward = {
    from: CultivationStage;
    to: CultivationStage;
    pointGain: number;
    isMajorBreakthrough: boolean;
};

export class CultivationPointSystem {
    public constructor(private readonly rewards: CultivationPointRewardConfig[]) {}

    public getMinorBreakthroughPoint(realmId: number, toMinorIndex: number): number {
        const config = this.getRewardConfig(realmId);
        const minorProgress = Math.max(0, toMinorIndex - 2);
        return config.basePoint + config.minorStepBonus * minorProgress;
    }

    public getMajorBreakthroughPoint(fromRealmId: number): number {
        return this.getRewardConfig(fromRealmId).majorBreakthroughBonus;
    }

    public calculateBreakthrough(from: CultivationStage, to: CultivationStage): CultivationBreakthroughReward {
        const isMajorBreakthrough = from.realmId !== to.realmId;
        const pointGain = isMajorBreakthrough
            ? this.getMajorBreakthroughPoint(from.realmId)
            : this.getMinorBreakthroughPoint(to.realmId, to.minorIndex);

        return {
            from,
            to,
            pointGain,
            isMajorBreakthrough,
        };
    }

    private getRewardConfig(realmId: number): CultivationPointRewardConfig {
        const config = this.rewards.find((item) => item.realmId === realmId);
        if (!config) {
            throw new Error(`Missing cultivation point reward config for realmId=${realmId}`);
        }
        return config;
    }
}
