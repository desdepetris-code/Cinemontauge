// services/animationService.ts

type AnimationType = 'flyToNav';
type Payload = { posterPath: string | null };
type Listener = (type: AnimationType, payload: Payload) => void;

class AnimationService {
    private listener: Listener | null = null;

    subscribe(newListener: Listener) {
        this.listener = newListener;
        return () => { this.listener = null; };
    }

    show(type: AnimationType, payload: Payload) {
        if (this.listener) {
            this.listener(type, payload);
        }
    }
}

export const animationService = new AnimationService();