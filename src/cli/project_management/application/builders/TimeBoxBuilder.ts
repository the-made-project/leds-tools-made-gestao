import { TimeBox, SprintItem } from "made-report-lib-test";

export class TimeBoxBuilder {
    private timeBox: Partial<TimeBox>

    constructor() {
        this.timeBox = {}
    }

    setId(id: string): TimeBoxBuilder {
        this.timeBox.id = id
        return this
    }

    setName(name: string): TimeBoxBuilder {
        this.timeBox.name = name
        return this
    }

    setDescription(description: string): TimeBoxBuilder {
        this.timeBox.description = description
        return this
    }

    setStartDate(startDate: string): TimeBoxBuilder {
        this.timeBox.startDate = startDate
        return this
    }

    setEndDate(endDate: string): TimeBoxBuilder {
        this.timeBox.endDate = endDate
        return this
    }

    /*setStatus(status: string): TimeBoxBuilder {
        this.timeBox.status = status
        return this
    }*/

    setStatus(status: "PLANNED" | "IN_PROGRESS" | "CLOSED"): TimeBoxBuilder {
        this.timeBox.status = status
        return this
    }

    setSprintItems(sprintItems: SprintItem[]): TimeBoxBuilder {
        this.timeBox.sprintItems = sprintItems
        return this
    }

    build(): TimeBox {
        if (!this.timeBox.id || !this.timeBox.name) {
            throw new Error("TimeBox must have an ID and a name.")
        }
        return this.timeBox as TimeBox
    }
}