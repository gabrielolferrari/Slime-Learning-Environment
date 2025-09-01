import * as tf from '@tensorflow/tfjs';

// O "estado" é o que o slime "vê". No nosso caso, são as coordenadas normalizadas
// do slime, da maçã mais próxima e do kiwi mais próximo.
// (x_slime, y_slime, x_apple, y_apple, x_kiwi, y_kiwi)
export const STATE_SIZE = 6;

// As "ações" são os movimentos que o slime pode fazer.
export const ACTIONS = ['up', 'down', 'left', 'right'];

export class SlimeBrain {
    private model: tf.Sequential;
    private learningRate = 0.01;
    private discountFactor = 0.95; // Importância de recompensas futuras
    public epsilon = 1.0; // Chance de tomar uma ação aleatória (exploração)
    private epsilonDecay = 0.995; // Fator de decaimento da exploração
    private epsilonMin = 0.01;

    constructor() {
        this.model = this.createModel();
    }

    private createModel(): tf.Sequential {
        const model = tf.sequential();
        model.add(tf.layers.dense({ inputShape: [STATE_SIZE], units: 24, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 24, activation: 'relu' }));
        model.add(tf.layers.dense({ units: ACTIONS.length, activation: 'linear' }));
        model.compile({ optimizer: tf.train.adam(this.learningRate), loss: 'meanSquaredError' });
        return model;
    }

    /**
     * Decide a próxima ação a ser tomada com base no estado atual.
     * Usa a estratégia epsilon-greedy para balancear exploração e uso do conhecimento.
     */
    chooseAction(state: number[]): number {
        if (Math.random() <= this.epsilon) {
            return Math.floor(Math.random() * ACTIONS.length); // Ação aleatória
        }
        // Ação baseada no que o modelo já aprendeu
        return tf.tidy(() => {
            const stateTensor = tf.tensor2d([state]);
            const qValues = this.model.predict(stateTensor) as tf.Tensor;
            return qValues.argMax(1).dataSync()[0];
        });
    }

    /**
     * Treina o modelo com base em uma experiência (o que aconteceu após uma ação).
     * @param done - Informa se a ação resultou em um estado terminal (ex: comer uma fruta).
     */
    async train(state: number[], action: number, reward: number, nextState: number[], done: boolean) {
        const target = tf.tidy(() => {
            const stateTensor = tf.tensor2d([state]);
            const nextStateTensor = tf.tensor2d([nextState]);

            const currentQValues = this.model.predict(stateTensor) as tf.Tensor;
            const nextQValues = this.model.predict(nextStateTensor) as tf.Tensor;

            const maxNextQ = nextQValues.max(1).dataSync()[0];
            const targetQ = Array.from(currentQValues.dataSync());

            // A fórmula de aprendizado do Q-learning
            if (done) {
                targetQ[action] = reward;
            } else {
                targetQ[action] = reward + this.discountFactor * maxNextQ;
            }

            return tf.tensor2d([targetQ]);
        });

        await this.model.fit(tf.tensor2d([state]), target, { epochs: 1, verbose: 0 });
        target.dispose();

        // Reduz o epsilon para que o slime explore menos com o tempo
        if (this.epsilon > this.epsilonMin) {
            this.epsilon *= this.epsilonDecay;
        }
    }
}
