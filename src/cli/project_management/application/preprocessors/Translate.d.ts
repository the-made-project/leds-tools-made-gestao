export abstract class Translate<T, R=T> {

    protected obj: T;

    public constructor(obj: T) {
        this.obj = obj;
    }

    /**
     * translate
     */
    public abstract translate(): R;
}


