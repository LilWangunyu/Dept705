document.addEventListener('DOMContentLoaded', function () {
    const SUPABASE_URL = 'https://xmkhxpivzqggjzikppnx.supabase.co'; 
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhta2h4cGl2enFnZ2p6aWtwcG54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ2OTMxNDcsImV4cCI6MjA0MDI2OTE0N30.OksTguigmY9jPFtY9symX34d0ULXm3uWXGWXHvmb5EM'; 
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    document.getElementById('breakdown-form').addEventListener('submit', addBreakdown);
    document.getElementById('search-bar').addEventListener('input', searchBreakdowns);

    async function addBreakdown(e) {
        e.preventDefault();

        const breakdown = {
            date: document.getElementById('date').value,
            department: document.getElementById('department').value,
            engineer: document.getElementById('engineer').value,
            machine: document.getElementById('machine').value,
            description: document.getElementById('description').value,
            action: document.getElementById('action').value,
            downtime: document.getElementById('downtime').value
        };

        const { data, error } = await supabase
            .from('breakdowns')
            .insert([breakdown]);

        if (error) {
            console.error("Error adding breakdown:", error);
        } else {
            console.log("Breakdown successfully added!", data);
            document.getElementById('breakdown-form').reset();
            displayBreakdowns(); // Refresh the list after adding a new breakdown
        }
    }

    async function displayBreakdowns() {
        const { data: breakdowns, error } = await supabase
            .from('breakdowns')
            .select('*')
            .order('id', { ascending: false });

        const breakdownList = document.getElementById('breakdown-list');
        breakdownList.innerHTML = '';

        if (error) {
            console.error("Error fetching breakdowns:", error);
            return;
        }

        breakdowns.forEach(breakdown => {
            const breakdownItem = document.createElement('div');
            breakdownItem.className = 'breakdown';
            breakdownItem.innerHTML = `
                <strong>Date:</strong> ${breakdown.date}<br>
                <strong>Department:</strong> ${breakdown.department}<br>
                <strong>Engineer:</strong> ${breakdown.engineer}<br>
                <strong>Machine:</strong> ${breakdown.machine}<br>
                <strong>Description:</strong> ${breakdown.description}<br>
                <strong>Action:</strong> ${breakdown.action}<br>
                <strong>Downtime:</strong> ${breakdown.downtime}<br>
                <button class="delete-btn" data-id="${breakdown.id}">Delete</button>
            `;
            breakdownList.appendChild(breakdownItem);
        });

        // Add event listeners to the delete buttons
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                deleteBreakdown(id);
            });
        });
    }

    async function deleteBreakdown(id) {
        if (!id) {
            console.error("Invalid ID for deletion");
            return;
        }

        const { error } = await supabase
            .from('breakdowns')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting breakdown:", error);
        } else {
            console.log("Breakdown successfully deleted!");
            displayBreakdowns(); // Refresh the list after deleting a breakdown
        }
    }

    async function searchBreakdowns(e) {
        const searchTerm = e.target.value.toLowerCase();

        const { data: breakdowns, error } = await supabase
            .from('breakdowns')
            .select('*');

        if (error) {
            console.error("Error fetching breakdowns:", error);
            return;
        }

        const filteredBreakdowns = breakdowns.filter(breakdown => {
            return breakdown.description.toLowerCase().includes(searchTerm) ||
                breakdown.machine.toLowerCase().includes(searchTerm) ||
                breakdown.department.toLowerCase().includes(searchTerm) ||
                breakdown.engineer.toLowerCase().includes(searchTerm);
        });

        const breakdownList = document.getElementById('breakdown-list');
        breakdownList.innerHTML = '';

        filteredBreakdowns.forEach(breakdown => {
            const breakdownItem = document.createElement('div');
            breakdownItem.className = 'breakdown';
            breakdownItem.innerHTML = `
                <strong>Date:</strong> ${breakdown.date}<br>
                <strong>Department:</strong> ${breakdown.department}<br>
                <strong>Engineer:</strong> ${breakdown.engineer}<br>
                <strong>Machine:</strong> ${breakdown.machine}<br>
                <strong>Description:</strong> ${breakdown.description}<br>
                <strong>Action:</strong> ${breakdown.action}<br>
                <strong>Downtime:</strong> ${breakdown.downtime}<br>
                <button class="delete-btn" data-id="${breakdown.id}">Delete</button>
            `;
            breakdownList.appendChild(breakdownItem);
        });

        // Add event listeners to the delete buttons for filtered results
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function () {
                const id = this.getAttribute('data-id');
                deleteBreakdown(id);
            });
        });
    }

    displayBreakdowns();
});
