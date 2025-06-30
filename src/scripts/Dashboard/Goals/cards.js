export function createGoalCard(goals) {
    return `
    <Card key={${t.id}} className="overflow-hidden">
        <CardHeader>
            <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className='p-2 rounded-lg'>
                <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div>
                <CardTitle className="text-lg">${t.title}</CardTitle>
                <CardDescription>Target: ${formatDate(t.targetDate)}</CardDescription>
                </div>
            </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>${progress(t.goal, t.progress)}%</span>
            </div>
            <Progress value=${progress(t.goal, t.progress)} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
                <p className="text-muted-foreground">Current</p>
                <p className="font-semibold text-green-600">${formatCurrency(t.currentAmount)}</p>
            </div>
            <div>
                <p className="text-muted-foreground">Target</p>
                <p className="font-semibold">${formatCurrency(t.goal)}</p>
            </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
                <p className="text-muted-foreground">Remaining</p>
                <p className="font-semibold text-orange-600">${formatCurrency(t.remaining)}</p>
            </div>
            <div>
                <p className="text-muted-foreground">Days Left</p>
                <p className={'font-semibold ${t.daysRemaining < 30 ? "text-red-600" : "text-gray-900"}'}>
                ${daysRemaining > 0 ? `${t.daysRemaining} days` : "Overdue"}
                </p>
            </div>
            </div>
        </CardContent>
    </Card>
    `;
}