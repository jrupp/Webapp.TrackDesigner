import Point = require("Classes/Domain/Model/Point");
import ConnectionPoint = require("Classes/Domain/Model/ConnectionPoint");
import Shape = require("Classes/Domain/Model/Shape");

import Observable = require("Classes/Utility/Observable");
import Observer = require("Classes/Utility/Observer");
import EventType = require("Classes/Utility/EventType");

class Layout extends Observable implements Observer {
	width: number;
	height: number;
	shapes: Shape[];
	currentElement: any = null;
	lastInsertedShape: Shape = null;
	
	constructor(width: number = 1000, height: number = 1000) {
		super();
		this.width = width;
		this.height = height;
		this.shapes = [];
		this.currentElement = this;
	}
	
	public getWidth(): number {
		return this.width;
	}
	
	public getHeight(): number {
		return this.height;
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
		this.adjustLayoutIfShapeOutside(shape);
		this.connectNearConnectionPoint(shape);
		shape.addObserver(this);
		this.setCurrentElement(shape);
	}
	
	private adjustLayoutIfShapeOutside(shape: Shape): void {
		var minCoordinates: { x: number; y: number; } = Point.getMinCoordinates(shape.getCorners());
		var deltaX: number = (minCoordinates.x < 0) ? 0-minCoordinates.x+10 : 0;
		var deltaY: number = (minCoordinates.y < 0) ? 0-minCoordinates.y+10 : 0;
		if(deltaX > 0 || deltaY > 0) {
			this.moveShapes(deltaX, deltaY);
		}
		
		var maxCoordinates: { x: number; y: number; } = Point.getMaxCoordinates(shape.getCorners());
		var deltaX: number = (maxCoordinates.x > this.width) ? maxCoordinates.x-this.width+10 : 0;
		var deltaY: number = (maxCoordinates.y > this.height) ? maxCoordinates.y-this.height+10 : 0;
		if(deltaX > 0 || deltaY > 0) {
			this.width += deltaX;
			this.height += deltaY;
			this.notifyObservers(EventType.objectResized, this);
		}
	}
	
	private moveShapes(deltaX: number, deltaY: number):void {
		this.width += deltaX;
		this.height += deltaY;
		this.notifyObservers(EventType.objectResized, this);
		
		for(var spi in this.shapes) {
			this.shapes[spi].move(deltaX, deltaY);
		}
		this.notifyObservers(EventType.objectMoved, this);
	}
	
	public rotateCurrentShape(): void {
		if(this.currentElement != null) {
			if(this.currentElement instanceof Shape) {
				this.currentElement.rotate();
				this.connectNearConnectionPoint(this.currentElement);
				this.adjustLayoutIfShapeOutside(this.currentElement);
				
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
		for(var spi: number = this.shapes.length-1; spi >= 0; spi--) {
			if(position.isInSquare(this.shapes[spi].getPosition(), this.shapes[spi].getVariant().getWidth()+this.shapes[spi].getVariant().getHeight())) {
				if(position.isInRectangle(this.shapes[spi].getPosition(), this.shapes[spi].getVariant().getWidth(), this.shapes[spi].getVariant().getHeight())) {
					this.setCurrentElement(this.shapes[spi]);
					return;
				}
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
		if(event === EventType.objectMoved && subject instanceof Shape) {		
		} else {
			this.notifyObservers(event, subject);
		}
	}
}

export = Layout;