import {
	KitoConfig,
	KitoInterface,
	Request,
	Response
} from '~/src/types/server'

class Kito implements KitoInterface {
	readonly config: KitoConfig

	constructor(config?: KitoConfig) {
		const DEFAULT_CONFIG: KitoConfig = {}

		this.config = { ...DEFAULT_CONFIG, ...config }
	}

	listen(
		options: { port: number; hostname?: string } | number,
		callback?: () => void
	): void {
		const portConfig =
			typeof options === 'number'
				? { port: options, hostname: 'localhost' }
				: { ...options, hostname: options.hostname || 'localhost' }

		callback?.()
	}

	get(path: string, callback: (req: Request, res: Response) => void): void {}

	post(path: string, callback: (req: Request, res: Response) => void): void {}

	put(path: string, callback: (req: Request, res: Response) => void): void {}

	patch(
		path: string,
		callback: (req: Request, res: Response) => void
	): void {}

	delete(
		path: string,
		callback: (req: Request, res: Response) => void
	): void {}
}

function kito(options?: KitoConfig): Kito {
	return new Kito(options)
}

export { kito }
