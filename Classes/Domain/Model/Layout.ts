import Point = require("Classes/Domain/Model/Point");
import ConnectionPoint = require("Classes/Domain/Model/ConnectionPoint");
import Shape = require("Classes/Domain/Model/Shape");

import Observable = require("Classes/Utility/Observable");
import Observer = require("Classes/Utility/Observer");
import EventType = require("Classes/Utility/EventType");

class Layout extends Observable implements Observer {
	shapes: Shape[];
	currentElement: any = null;
	lastInsertedShape: Shape = null;
	
	constructor() {
		super();
		this.shapes = [];
		this.currentElement = this;
	}
	
	public getCurrentElement(): any {
		return this.currentElement;
	}
	
	private setCurrentElement(element: any) {
		this.currentElement = element;		
		this.notifyObservers(EventType.propertyChanged, this.currentElement);
	}
	
	public setStartPoint(point: Point): void {
		this.setCurrentElement(point);
	}
	
	public addShape(shape: Shape): void {
		this.shapes.push(shape);
		this.lastInsertedShape = shape;
		if(shape.getPosition().getX() < shape.getVariant().getWidth()/2+shape.getVariant().getHeight()/2) {
			this.moveShapes(shape.getVariant().getWidth()+shape.getVariant().getHeight(), 0);
		}
		if(shape.getPosition().getY() < shape.getVariant().getWidth()/2+shape.getVariant().getHeight()/2) {
			this.moveShapes(0, shape.getVariant().getWidth()+shape.getVariant().getHeight());
		}
		this.connectNearConnectionPoint(shape);
		shape.addObserver(this);
		this.setCurrentElement(shape);
	}
	
	private moveShapes(deltaX: number, deltaY: number) {
		for(var spi in this.shapes) {
			this.shapes[spi].move(deltaX, deltaY);
		}
	}
	
	public rotateCurrentShape(): void {
		if(this.currentElement != null) {
			if(this.currentElement instanceof Shape) {
				this.currentElement.rotate();
				this.connectNearConnectionPoint(this.currentElement);
				
				// rotate last inserted element? -> adjust default rotation position
				if(this.currentElement === this.lastInsertedShape) {
					this.currentElement.getType().moveDefaultFirstConnectionPointPositionToNext();
				}
			}
		}
	}
	
	public removeShape(shape: Shape): void {
		shape.removeObserver(this);
		shape.removeConnectionPoints();
		var pos: number = this.shapes.indexOf(shape);
		this.shapes.splice(pos, 1);
		shape = null;
		this.notifyObservers(EventType.childRemoved, null);
	}
	
	public removeCurrentShape(): void {
		if(this.currentElement != null) {
			if(this.currentElement instanceof Shape) {
				var firstNeighbor: Shape = this.currentElement.getFirstNeighbor();
				this.removeShape(this.currentElement);
				if(firstNeighbor != null) {
					this.setCurrentElement(firstNeighbor);
					this.lastInsertedShape = firstNeighbor;
				}
			}
		}
	}
	
	public setCurrentElementByPosition(position: Point, config: any): void {
		for(var spi in this.shapes) {
			if(position.isInCircle(this.shapes[spi].getPosition(), config['shapePointSize'])) {
				this.setCurrentElement(this.shapes[spi]);
				return;
			}
		}
		this.setCurrentElement(position);
	}
	
	private connectNearConnectionPoint(shape: Shape): ConnectionPoint {
		var connectionPoints: ConnectionPoint[] = shape.getConnectionPoints();
		for(var cpi in connectionPoints) {
			if(connectionPoints[cpi].getConnection() == null) {
				for(var spi in this.shapes) {
					if(shape != this.shapes[spi]) {
						var shapeConnectionPoints: ConnectionPoint[] = this.shapes[spi].getConnectionPoints();
						for(var scpi in shapeConnectionPoints) {
							if(connectionPoints[cpi].getPosition().equals(shapeConnectionPoints[scpi].getPosition()) && shapeConnectionPoints[scpi].getConnection() == null) {
								connectionPoints[cpi].connectTo(shapeConnectionPoints[scpi]);
								return shapeConnectionPoints[scpi];
							}
						}
					}
				}
			}
		}
	}
	
	public notify(event: EventType, notifier: Observable, subject: any) {
		this.notifyObservers(event, subject);
	}
}

export = Layout;